import React, { Component } from 'react';
import '../styles/tableproducers.css'
import { Table, Alert } from 'react-bootstrap'
import ModalProducerInfo from './Modals/ModalProducerInfo'
import nodeInfoAPI from '../scripts/nodeInfo'
import getHummanTime from '../scripts/timeHelper'
import serverAPI from '../scripts/serverAPI';

class TableProducers extends Component {
    constructor(props) {
        super(props);
        this.state = {
            producers: [],
            activeProducerName: '',
            totalVotesWheight: 0,
            nodeVersion: '',
            currentBlockNumber: 0,
            blocksProduced: [],
            blockTime: 0,
            lastTimeProduced: [],
            lastIrrBlockNumber: 0,
            producersLatency: [],
            showModalProducerInfo: false,
            producerSelected: ''
        }
    }

    async componentWillMount() {
        if (await this.getProducersInfo()) {
            console.log(this.state.producers)
            await this.updateProducersInfo();
        }
    }

    componentDidMount() {
        let producerIndex = 0;
        setInterval(async () => {
            await this.getProducerLatency(producerIndex++);
            if (producerIndex > this.state.producers.length - 1) producerIndex = 0;
        }, 1000);
    }

    async getProducersInfo() {
        let data = await nodeInfoAPI.getProducers();
        if (data) {
            let producers = data.rows;

            this.setState({
                producers: producers,
                totalVotesWheight: data.total_producer_vote_weight
            });
            return true;
        } else return false;
    }

    async updateProducersInfo() {
        if (this.state.producers.length > 0) {
            setInterval(async () => {
                let nodeInfo = await nodeInfoAPI.getInfo();
                let producerIndex = this.state.producers.findIndex((bp) => bp.owner === nodeInfo.head_block_producer);
                let blocksProduced = new Array(this.state.producers.length);
                let lastTimeProduced = new Array(this.state.producers.length);

                if (producerIndex > -1) {
                    blocksProduced = this.state.blocksProduced;
                    blocksProduced[producerIndex] = nodeInfo.head_block_num;

                    lastTimeProduced = this.state.lastTimeProduced;
                    lastTimeProduced[producerIndex] = nodeInfo.head_block_time;

                    await this.getProducerLatency(producerIndex);
                }

                this.setState({
                    nodeVersion: nodeInfo.server_version,
                    activeProducerName: nodeInfo.head_block_producer,
                    currentBlockNumber: nodeInfo.head_block_num,
                    blockTime: nodeInfo.head_block_time,
                    lastIrrBlockNumber: nodeInfo.last_irreversible_block_num,
                    blocksProduced: blocksProduced
                });
            }, 1000);
        }
    }

    getLasTimeBlockProduced(bpBlockTime) {
        let bTime = new Date(bpBlockTime);
        bTime.setHours(bTime.getHours() - 7);
        bTime = Number(bTime);
        let now = Number(new Date());

        let lastTimeProduced = getHummanTime(Math.floor(now - bTime) / 1000);

        return lastTimeProduced;
    }

    getProducerPercentage(bp) {
        let producerPercentage = (parseFloat(bp.total_votes * 100)) / parseFloat(this.state.totalVotesWheight);
        let strProducerPercentage = producerPercentage.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

        return strProducerPercentage;
    }

    async getProducerLatency(producerIndex) {
        if (this.state.producers.length > 0) {
            let url = this.state.producers[producerIndex].url;
            let result = await serverAPI.getEndpointLatency(url);
            let latency = result.latency;
            let pLatency = new Array(this.state.producers.length);
            pLatency = this.state.producersLatency;
            pLatency[producerIndex] = latency < 1000 ? latency : "-";
            this.setState({
                producersLatency: pLatency
            });
        }
    }

    showProducerInfo(producerSelected) {
        this.setState({
            producerSelected: producerSelected,
            showModalProducerInfo: !this.state.showModalProducerInfo
        });
    }

    renderTableBody() {
        if (this.state.producers.length > 0) {
            let body =
                <tbody>
                    {
                        this.state.producers.map((val, i) => {
                            return (
                                <tr key={i} className={val.owner === this.state.activeProducerName ? "activeProducer" :
                                    val.is_active == 1 ? "" : "offProducer"}>
                                    <td>{i + 1}</td>
                                    <td>
                                        <a href="#" onClick={(e) => {
                                            e.preventDefault();
                                            this.showProducerInfo(val.owner);
                                        }}>

                                            {val.owner}
                                        </a>
                                    </td>
                                    <td>{this.state.producersLatency[i]} ms</td>
                                    <td>{val.owner === this.state.activeProducerName ? this.state.currentBlockNumber : this.state.blocksProduced[i]} </td>
                                    <td>{val.owner === this.state.activeProducerName ?
                                        "producing block..." :
                                        this.getLasTimeBlockProduced(this.state.lastTimeProduced[i])}
                                    </td>
                                    {/* <td>organization</td> */}
                                    <td>{this.getProducerPercentage(val) + "%"}</td>
                                </tr>
                            )
                        })
                    }
                </tbody>;
            return body;
        } else return (
            <div>
            </div>
        );
    }

    render() {

        if (this.state.producers.length > 0) {
            return (
                <div>
                    <h4>Block version: {this.state.nodeVersion}</h4>
                    <h6>Block: {this.state.currentBlockNumber}</h6>
                    <h6>Last irreversible block: {this.state.lastIrrBlockNumber}</h6>
                    <br />
                    <h2>Producers</h2>
                    <div className="tableContainer">
                        <Table responsive>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Latency</th>
                                    <th>Last block</th>
                                    <th>Last time produced</th>
                                    {/* <th>Organization</th> */}
                                    <th>Votes</th>
                                </tr>
                            </thead>
                            {this.renderTableBody()}
                        </Table>
                    </div>
                    <ModalProducerInfo show={this.state.showModalProducerInfo} onHide={() => this.showProducerInfo('')} producername={this.state.producerSelected} />
                </div>
            );
        } else return (
            <Alert bsStyle="danger">
                <strong>Server Error:</strong> There are no producers found
            </Alert>
        );
    }
}

export default TableProducers;
