import React, { Component } from 'react';
import { Modal, Button } from 'react-bootstrap'
import FormCustomControl from '../FormControls/FormCustomControl'
import serverAPI from '../../scripts/serverAPI'
import nodeAPI from '../../scripts/nodeInfo'

//regex
const urlRegexWithPort = new RegExp(/^(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,}):[0-9]+$/);
const urlRegex = new RegExp(/^(((?!-))(xn--|_{1,1})?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/);
const ipRegex = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/g);

//validate port number
function hasValidPortNumber(validationTarget){
    const portNumber = validationTarget.slice(validationTarget.lastIndexOf(':') + 1);
    if(isNaN(portNumber)) return false;
    if(parseInt(portNumber) > 65535) return false;
    if(parseInt(portNumber) < 0) return false;
    return true;  
}

class ModalRegisterProducer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nodeVersion: "",
            producerName: "",
            organization: "",
            serverLocation: "",
            httpServerAddress: "",
            httpsServerAddress: "",
            p2pListenEndpoint: "",
            p2pServerAddress: "",
            producerPublicKey: "",
            ownerPublicKey: "",
            activePublicKey: "",
            url: "",
            telegramChannel: "",

            allProducersName:[],
            //touch states
            producerNameTouched: false,
            serverAddressTouched: false,
            p2pListenEndpointTouched: false,
            p2pServerAddressTouched: false,
            producerPublicKeyTouched: false,
            ownerPublicKeyTouched: false,
            activePublicKeyTouched: false,
            urlTouched: false,

            httpClass: ''
        }
    }

    async componentWillMount() {
        let nodeInfo = await nodeAPI.getInfo();
        if(nodeInfo){
            let nodeVersion = nodeInfo.server_version;
            let data = await nodeAPI.getProducers();
            let allproducers = data.rows;
            let allProducersName = allproducers.map(val=> val.owner);
            
            this.setState({
                nodeVersion: nodeVersion,
                allProducersName:allProducersName
            });
        }
    }

    onModalHide() {
        this.props.onHide();
    }

    onRegister() {
        //find producer name
        let pNameIndex = this.state.allProducersName.findIndex((name) => name === this.state.producerName);
        if(pNameIndex > -1){
            alert('Producer name already exists.');
            return;
        }
        let producer = {};
        producer.nodeVersion = this.state.nodeVersion;
        producer.name = this.state.producerName;
        producer.organization = this.state.organization;
        producer.serverLocation = this.state.serverLocation;
        producer.httpServerAddress = this.state.httpServerAddress;
        producer.httpsServerAddress = this.state.httpsServerAddress;
        producer.p2pListenEndpoint = this.state.p2pListenEndpoint;
        producer.p2pServerAddress = this.state.p2pServerAddress;
        producer.producerPublicKey = this.state.producerPublicKey;
        producer.ownerPublicKey = this.state.ownerPublicKey;
        producer.activePublicKey = this.state.activePublicKey;
        producer.url = this.state.url;
        producer.telegramChannel = this.state.telegramChannel;

        if(
            this.getProducerNameValidationState() !== 'success' ||
            this.validateServerAddresses() !== 'has-error' ||
            this.getP2pListenEndpointValidationState() !== 'success' ||
            this.getP2pServerAddressValidationState() !== 'success' ||
            this.getProducerPublicKeyValidationState() !== 'success' ||
            this.getOwnerPublicKeyValidationState() !== 'success' ||
            this.getActivePublicKeyValidationState() !== 'success' ||
            this.getUrlValidationState() !== 'success'
        ){
            this.setState({
                producerNameTouched: true,
                serverAddressTouched: true,
                p2pListenEndpointTouched: true,
                p2pServerAddressTouched: true,
                producerPublicKeyTouched: true,
                ownerPublicKeyTouched: true,
                activePublicKeyTouched: true,
                urlTouched: true
            });
            alert('There is an error.  Please check all of your inputs.');
            return;
        }
        
        serverAPI.registerProducerNode(producer,(res)=>{
            alert(res);
           this.onModalHide();
        });
                                       
    }

    onProducerNameChange(arg) {
        this.setState({
            producerName: arg.target.value
        });
    }

    getProducerNameValidationState() {
        if(!this.state.producerNameTouched) return null;

        const producerRegex = new RegExp(/^[a-z1-5_\-]+$/);
        const { producerName } = this.state;
        const length = producerName.length;

        if (length != 12 || !producerRegex.test(producerName)) return 'error';
        else return 'success';

        return null;
    }

    onOrganizationChange(arg) {
        this.setState({
            organization: arg.target.value
        })
    }

    onServerLocationChange(arg) {
        this.setState({
            serverLocation: arg.target.value
        })
    }

    onHttpServerAddressChange(arg) {
        this.setState({
            httpServerAddress: arg.target.value
        })
    }

    onHttpsServerAddressChange(arg) {
        this.setState({
            httpsServerAddress: arg.target.value
        })
    }

    validateServerAddresses(){
        const {httpServerAddress, httpsServerAddress} = this.state;

        let httpValidationTarget = httpServerAddress;
        let httpsValidationTarget = httpsServerAddress;
        if(httpServerAddress.indexOf('http://') === 0){
            httpValidationTarget = httpServerAddress.slice(7);
        }
        if(httpsServerAddress.indexOf('https://') === 0){
            httpsValidationTarget = httpsServerAddress.slice(8);
        }
        const httpValidPortNumber = hasValidPortNumber(httpValidationTarget);
        const httpsValidPortNumber = hasValidPortNumber(httpsValidationTarget);

        if(
            (ipRegex.test(httpsValidationTarget) && httpServerAddress === '' && httpsValidPortNumber) ||
            (ipRegex.test(httpValidationTarget) && httpsServerAddress === '' && httpValidPortNumber)
        ){
            this.setState({httpClass: 'has-success'});
            return;
        }
        this.setState({httpClass: 'has-error'});
    }

    onP2pListenEndpointChange(arg) {
        this.setState({
            p2pListenEndpoint: arg.target.value
        })
    }

    getP2pListenEndpointValidationState(){
        if(!this.state.p2pListenEndpointTouched) return null;
        const {p2pListenEndpoint} = this.state;

        let validationTarget = p2pListenEndpoint;
        //check for http, https
        if(p2pListenEndpoint.indexOf('http://') === 0) validationTarget = p2pListenEndpoint.slice(7);
        else if(p2pListenEndpoint.indexOf('https://') === 0) validationTarget = p2pListenEndpoint.slice(8);
        //validate port number
        if(!hasValidPortNumber(validationTarget)) return 'error';
        
        if(urlRegexWithPort.test(validationTarget) || ipRegex.test(validationTarget)) return 'success';
        return 'error';

    }

    onP2pServerAddressChange(arg) {
        this.setState({
            p2pServerAddress: arg.target.value
        })
    }

    getP2pServerAddressValidationState(){
        if(!this.state.p2pServerAddressTouched) return null;
        const {p2pServerAddress} = this.state;

        let validationTarget = p2pServerAddress;
        //check for http, https
        if(p2pServerAddress.indexOf('http://') === 0) validationTarget = p2pServerAddress.slice(7);
        if(p2pServerAddress.indexOf('https://') === 0) validationTarget = p2pServerAddress.slice(8);
        //validate port number
        if(!hasValidPortNumber(validationTarget)) return 'error';
        
        if(urlRegexWithPort.test(validationTarget) || ipRegex.test(validationTarget)) return 'success';

        return 'error';
    }

    onProducerPublicKeyChange(arg) {
        this.setState({
            producerPublicKey: arg.target.value
        })
    }

    getProducerPublicKeyValidationState(){
        if(!this.state.producerPublicKeyTouched) return null;
        const {producerPublicKey} = this.state;
        const length = producerPublicKey.length;
        const producerPublicKeyRegex = new RegExp(/^[a-zA-Z0-9_\-]+$/);

        if( producerPublicKey.slice(0, 4) != 'TLOS' ||
            length != 54 ||
            !producerPublicKeyRegex.test(producerPublicKey) ){
            return 'error';
        } else {
            return 'success';
        }
        return null;
    }

    onOwnerPublicKeyChange(arg) {
        this.setState({
            ownerPublicKey: arg.target.value
        })
    }

    getOwnerPublicKeyValidationState(){
        if(!this.state.ownerPublicKeyTouched) return null;
        const {ownerPublicKey} = this.state;
        const length = ownerPublicKey.length;
        const ownerPublicKeyRegex = new RegExp(/^[a-zA-Z0-9_\-]+$/);
        
        if( ownerPublicKey.slice(0, 4) != 'TLOS' ||
            length != 54 ||
            !ownerPublicKeyRegex.test(ownerPublicKey) ){
            return 'error';
        } else {
            return 'success';
        }
        return null;
    }

    onActivePublicKeyChange(arg) {
        this.setState({
            activePublicKey: arg.target.value
        })
    }

    getActivePublicKeyValidationState(){
        if(!this.state.activePublicKeyTouched) return null;
        const {activePublicKey} = this.state;
        const length = activePublicKey.length;
        const activePublicKeyRegex = new RegExp(/^[a-zA-Z0-9_\-]+$/);
        
        if( activePublicKey.slice(0, 4) != 'TLOS' ||
            length != 54 ||
            !activePublicKeyRegex.test(activePublicKey) ){
            return 'error';
        } else {
            return 'success';
        }
        return null;
    }

    onUrlChange(arg) {
        this.setState({
            url: arg.target.value
        })
    }

    getUrlValidationState(){
        if(!this.state.urlTouched) return null;
        const {url} = this.state;

        let validationTarget = url;
        if (url.indexOf('http://') === 0) validationTarget = url.slice(7);
        if (url.indexOf('https://') === 0) validationTarget = url.slice(8);
        return urlRegex.test(validationTarget) ? 'success' : 'error';
    }

    onTelegramChannelchange(arg) {
        this.setState({
            telegramChannel: arg.target.value
        })
    }

    render() {
        return (
            <Modal
                {...this.props}
                bsSize="large"
                aria-labelledby="contained-modal-title-lg">
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-lg">Register node</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <FormCustomControl
                            id="txtProducerName"
                            validationstate={this.getProducerNameValidationState()}
                            label="Producer name"
                            type="text"
                            help="length 12, lowercase a-z, 1-5"
                            value={this.state.producerName}
                            onChange={(arg) => this.onProducerNameChange(arg)}
                            onFocus={() => this.setState({producerNameTouched: true})}
                        />
                        <FormCustomControl
                            id="txtOrganization"
                            label="Organization"
                            type="text"
                            value={this.state.organization}
                            onChange={(arg) => this.onOrganizationChange(arg)}
                        />
                        <FormCustomControl
                            id="txtServerLocation"
                            label="Server location"
                            help="Seattle, USA"
                            type="text"
                            value={this.state.serverLocation}
                            onChange={(arg) => this.onServerLocationChange(arg)}
                        />
                        <FormCustomControl
                            id="txtHttpServerAddress"
                            label="Http server address"
                            type="text"
                            help="0.0.0.0:8888, please choose either HTTP or HTTPS server address"
                            value={this.state.httpServerAddress}
                            httpclass={this.state.httpClass}
                            onChange={e => this.setState({httpServerAddress: e.target.value})}
                            onKeyUp={() => this.validateServerAddresses()}
                            onFocus={() => this.setState({serverAddressTouched: true})}
                        />
                        <FormCustomControl
                            id="txtHttpsServerAddress"
                            label="Https server address"
                            type="text"
                            help="0.0.0.0:443, please choose either HTTP or HTTPS server address"
                            value={this.state.httpsServerAddress}
                            httpclass={this.state.httpClass}
                            onChange={e => this.setState({httpsServerAddress: e.target.value})}
                            onKeyUp={() => this.validateServerAddresses()}
                            onFocus={() => this.setState({serverAddressTouched: true})}
                        />
                        <FormCustomControl
                            id="txtP2pListenEndpoint"
                            validationstate={this.getP2pListenEndpointValidationState()}
                            label="P2P Listen endpoint"
                            type="text"
                            help="0.0.0.0:9876"
                            value={this.state.p2pListenEndpoint}
                            onChange={(e) => this.setState({p2pListenEndpoint: e.target.value})}
                            onFocus={() => this.setState({p2pListenEndpointTouched: true})}
                        />
                        <FormCustomControl
                            id="txtP2pServerEndpoint"
                            validationstate={this.getP2pServerAddressValidationState()}
                            label="P2P server address"
                            type="text"
                            help="IP_ADDRESS:9876"
                            value={this.state.p2pServerAddress}
                            onChange={(arg) => this.onP2pServerAddressChange(arg)}
                            onFocus={() => this.setState({p2pServerAddressTouched: true})}
                        />
                        <FormCustomControl
                            id="txtProducerPublicKey"
                            validationstate={this.getProducerPublicKeyValidationState()}
                            label="Producer public key"
                            type="text"
                            help="TLOS7d9vjuzCT67Jv9hZrBY8R3LhvHMrHepN1ArSeY3e1EKKaEUEc8"
                            value={this.state.producerPublicKey}
                            onChange={(arg) => this.onProducerPublicKeyChange(arg)}
                            onFocus={() => this.setState({producerPublicKeyTouched: true})}
                        />
                        <FormCustomControl
                            id="txtOwnerPublicKey"
                            validationstate={this.getOwnerPublicKeyValidationState()}
                            label="Owner public key"
                            type="text"
                            help="TLOS7d9vjuzCT67Jv9hZrBY8R3LhvHMrHepN1ArSeY3e1EKKaEUEc8"
                            value={this.state.ownerPublicKey}
                            onChange={(arg) => this.onOwnerPublicKeyChange(arg)}
                            onFocus={() => this.setState({ownerPublicKeyTouched: true})}
                        />
                        <FormCustomControl
                            id="txtActivePublicKey"
                            validationstate={this.getActivePublicKeyValidationState()}
                            label="Active public key"
                            type="text"
                            help="TLOS7d9vjuzCT67Jv9hZrBY8R3LhvHMrHepN1ArSeY3e1EKKaEUEc8"
                            value={this.state.activePublicKey}
                            onChange={(arg) => this.onActivePublicKeyChange(arg)}
                            onFocus={() => this.setState({activePublicKeyTouched: true})}
                        />
                        <FormCustomControl
                            id="txtTelegramChannel"
                            label="Telegram channel"
                            type="text"
                            help="@yourTelegramChannel"
                            value={this.state.telegramChannel}
                            onChange={(arg) => this.onTelegramChannelchange(arg)}
                        />
                        <FormCustomControl
                            id="txtURL"
                            validationstate={this.getUrlValidationState()}
                            label="URL"
                            type="text"
                            help="http://telosfoundation.io"
                            value={this.state.url}
                            onChange={(arg) => this.onUrlChange(arg)}
                            onFocus={() => this.setState({urlTouched: true})}
                        />
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => this.onModalHide()}>Close</Button>
                    <Button onClick={() => this.onRegister()}>Register</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

export default ModalRegisterProducer;