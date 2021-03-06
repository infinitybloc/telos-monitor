import React, {Component} from 'react';
import {Row, Col, Modal, Button, ButtonToolbar} from 'react-bootstrap';
import NodeInfo from './NodeInfo';
import ProducerMap from './ProducerMap';
import serverAPI from '../scripts/serverAPI';
import axios from 'axios';
import ModalStatus from './Modals/ModalStatus';

import {MAPS_API_KEY} from '../config/mapsConfig';

const IP_API_ENDPOINT = 'http://api.ipstack.com/';
const IP_API_KEY = 'a7343db90e25aaf2690677dd4437fea3';

export default class InfoBar extends Component {
	constructor(props, context){
		super(props, context);

		this.state = { 
			show: false,
			showStatus: false,
			accounts: [],
			ip_locations: []
		};
	}
	componentDidMount(){
		axios.get('/api/v1/geolocate')
		.then(res => console.log(res.data))
		.catch(err => console.log(err));
		
        serverAPI.getAllAccounts(async (res) => {
            this.setState({
                accounts: res.data
            });
            this.getLatAndLong();
        });
	}

	getLatAndLong(){
		//get from local storage to prevent lots of api calls
		const ipLocations = window.localStorage.getItem('telos_testnet_ip_locations');
		console.log(ipLocations);
		if(ipLocations){
			this.setState({ip_locations: JSON.parse(ipLocations)});
			return;
		}

		const httpAddresses = this.state.accounts.map(acct => acct.httpServerAddress == '' ? acct.httpsServerAddress : acct.httpServerAddress);
		//filter out port numbers and local ips
		const filteredIps = httpAddresses.map(ip => ip.slice(0, ip.indexOf(':')))
								 		 .filter(ip => ip != '0.0.0.0');

		console.log(filteredIps);
		filteredIps.forEach(ip => {
			axios.get(IP_API_ENDPOINT + ip, {
				params: {
					access_key: IP_API_KEY
				}
			})
			.then(res => {
				const arr = this.state.ip_locations;
				arr.push(res.data);
				this.setState({ip_locations: arr});
				//write locations to local storage
				window.localStorage.setItem('telos_testnet_ip_locations', JSON.stringify(this.state.ip_locations));
			})
			.catch(err => console.log(err));
		});
	}


	render(){

     return (
     	<div>
	        <Row>
	        	<Col sm={6}>
	        		<NodeInfo />
	        	</Col>
	        	<Col sm={6}>
	        		<ButtonToolbar style={{float: 'right'}}>
		        		<Button className='testnet_status_btn' bsStyle="primary" onClick={() => this.setState({showStatus: true})}>
		        			Testnet Status
		        		</Button>
				        <Button bsStyle="default" onClick={() => this.setState({show: true})}>
				          Node Map
				        </Button>
			        </ButtonToolbar>
	        	</Col>
	        </Row>
	        <ModalStatus show={this.state.showStatus} onHide={() => this.setState({showStatus: false})} />
	        <Modal show={this.state.show} onHide={() => this.setState({show: false})}         
				{...this.props}
       			bsSize="large"
        		aria-labelledby="contained-modal-title-lg">
	          <Modal.Header closeButton>
	          	<h2>Node Map</h2>
	          </Modal.Header>
	          <Modal.Body>
	          	{this.state.ip_locations.length > 0 ? 
	          		<ProducerMap 
	          			loadingElement={<div style={{ height: `100%` }} />}
	          			containerElement={<div style={{ height: `800px` }} />}
	          			mapElement={<div style={{ height: `100%` }} />}
	          			googleMapURL={`https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=${MAPS_API_KEY}`}
	          			ip_locations={this.state.ip_locations} /> 
	          		: 
	          		<div>Getting Nodes...</div>
	          	}
	          </Modal.Body>
	        </Modal>
	      </div>
      );
	}
}