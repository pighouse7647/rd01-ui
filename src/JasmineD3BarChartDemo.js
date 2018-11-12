/* global _:true */

import React, {Component} from "react";
import es6BindAll from "es6bindall";
import _ from "lodash";
// import '../../../public/css/react-toggle.css';
import * as PropTypes from "prop-types";
import * as d3 from 'd3';
import "react-d3-treemap/dist/react.d3.treemap.css";

export default class JasmineD3BarChartDemo extends Component {

  constructor(props) {
    super(props);
    this.state = {
      pieShow: true,
      showToolTip: false,
      top: 0,
      left: 0,
      value: '',
      key: '',
      data: [],
      groupCols: [],
      node: '',
    };
    this.svg = {};
    es6BindAll(this, []);
    this.BOX_WIDTH = 900;
    this.scaling = currentMax => a => {
      let v = currentMax / 900;
      // console.log('比例', v, a.value)
      a.value = Number(a.value) / Number(v);
      return a;
    };
    this.DESC_COMPARATOR = (l, r) => r - l;
    this.ASC_STR_COMPARATOR = (a, b) => {
      let nameA = a[0].toUpperCase();
      let nameB = b[0].toUpperCase();
      if (nameA < nameB) {
        return 1;
      }
      if (nameA > nameB) {
        return -1;
      }
      // names must be equal
      return 0;
    };
    this.Y_BAR_INTERVAL = 30;
    this.Y_BAR_THICK = 25;
    this.BAR_BG_COLOR = 'grey';

    this.amountClassifior = a => {
      if (a.amount < 10000) {
        return 'H0';
      } else if (a.amount < 20000) {
        return 'H1';
      } else if (a.amount < 30000) {
        return 'H2';
      } else if (a.amount < 40000) {
        return 'H3';
      } else if (a.amount < 50000) {
        return 'H4';
      } else if (a.amount < 60000) {
        return 'H5';
      } else if (a.amount < 70000) {
        return 'H6';
      } else {
        return 'H7';
      }
    };

    this.colorMap = new Map();
    this.colorMap.set('A', 'DodgerBlue');
    this.colorMap.set('B', 'DeepSkyBlue');
    this.colorMap.set('C', 'steelBlue');
    this.colorMap.set('D', 'Turquoise');
    this.colorMap.set('E', 'SlateBlue');
    this.colorMap.set('F', 'RoyalBlue');
    this.colorMap.set('G', 'MediumBlue');
  }

  componentWillReceiveProps(nextProps) {
    console.log('nextData=(%o), stateDate=(%o)', nextProps.data, this.state.data)
    if (nextProps.data != this.state.data) {
      let currentMax = nextProps.data.map(a => a.value).sort(this.DESC_COMPARATOR)[0];
      this.setState({data: nextProps.data}, () => {
        // return this.createChart();
      });
    }
  }

  componentDidMount() {
    let diameter = 900;
    let select = d3.select(this.refs.barChartRef);
    this.svg = select.append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("className", "barchart");
    //
    // let currentMax = this.props.data.map(a => a.value).sort(this.DESC_COMPARATOR)[0];
    //
    this.setState({
      data: this.props.data

    }, () => {
      // return this.createChart();
    });
  }

  componentDidUpdate() {
    // console.log('元件更新後', this.state)
    this.svg.selectAll("*").remove();
    this.createChart();
  }

  render() {
    let uuidv4 = () =>
        ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    let currentMax = this.state.data.map(a => a.value).sort(this.DESC_COMPARATOR)[0];
    let v = currentMax / 900;

    return (<div>
      <div>目前總和:{Number(Math.round(this.state.data.map(a => a.value).reduce((a, b) => Number(a) + Number(b), 0)).toFixed(2))}</div>
      <button
          className={'btn btn-primary'}
          onClick={e => {
            this.setState({
                  data:
                      [...this.state.data,
                        Object.assign({}, {...this.state.data[Math.round(Math.random() % this.state.data.length).toFixed(0)]},
                            {
                              key: uuidv4(), amount: Number(Math.round(Math.random() * 5 * 10000).toFixed(0)), value: Number(Math.round(Math.random() * 10000000).toFixed(0))
                            })]
                },
                () => {
                  // return this.createChart();
                });
          }}>刷新
      </button>
      <div ref={'barChartRef'}></div>
    </div>);
  }

  createChart() {
    let groupedData = _.groupBy(this.state.data, this.amountClassifior);
    let accumulatedGroupedData = this.getAccumulatedGroupedData(groupedData);

    let upperBound = [...accumulatedGroupedData]
    .map(a => a[1].map(b => b.value).sort(this.DESC_COMPARATOR)[0])
    .sort(this.DESC_COMPARATOR)[0];

    // console.log('最大值', upperBound, zoomRatio)
    console.log('分組後資料', groupedData)
    Object.entries(groupedData).sort(this.ASC_STR_COMPARATOR).forEach((entry, columnIndex) => {
      let group = entry[0];
      let data = entry[1].sort((a, b) => {
        let nameA = a.name.toUpperCase();
        let nameB = b.name.toUpperCase();
        if (nameA < nameB) {
          return 1;
        }
        if (nameA > nameB) {
          return -1;
        }
        // names must be equal
        return 0;
      });
      let greenBars = this.svg.selectAll(`.${group}`).data(data, d => d.key);

      this.svg.selectAll('.rect')
      .exit()
      // .transition()
      // .attr("class", "exit")
      // .attr("x", 0)
      // .attr('y', 0)
      .remove();


      let accumulatedGroupedDatum = accumulatedGroupedData.get(group);
      let localUpperBound = accumulatedGroupedDatum.map(a => a.value).sort(this.DESC_COMPARATOR)[0];
      let zoomRatio = Number(upperBound) / 900;
      console.log('group=(%o), locally upperBound=(%o), Global upperBound=(%o), zoom Ratio=(%o)', group, localUpperBound, upperBound, zoomRatio);




      let accumValue = (d, i) => [...accumulatedGroupedDatum].filter(g => g.key == d.key)[0].value;
      let accumPreValue = (d, i) => {
        // console.log('g', [...accumulatedGroupedDatum])
        let any = [...accumulatedGroupedDatum]
        .map((g, index) => {
          if (g.key == d.key) {
            return [...accumulatedGroupedDatum][index - 1];
          } else {
            return null;
          }
        })
        .filter(a => a != null)[0];

        return any ? any.value : 0;
      };
      let accumNextValue = (d, i) => {
        // console.log('g', [...accumulatedGroupedDatum])
        return [...accumulatedGroupedDatum].map((g, index) => {
          if (g.key == d.key) {
            return [...accumulatedGroupedDatum][index + 1];
          } else {
            return null;
          }
        }).filter(a => a != null) || [{value: 900}][0].value;
      };



      // ENTER
      // 方塊
      greenBars
      .enter()
      .append('rect')
      .attr('x', localUpperBound / zoomRatio)
      .attr('width', 900 - (localUpperBound / zoomRatio))
      .attr('y', columnIndex * this.Y_BAR_INTERVAL)
      .attr('height', this.Y_BAR_THICK)
      .attr('fill', (d) => `${this.colorMap.get(d.name)}`)
      .attr('class', `${group}`)
      .transition()
      .duration(1600)
      .attr('x', (d , i) => {
        if(i > 0) console.log('左', (accumPreValue(d, i)/zoomRatio))

        return (i == 0 ? 0 : accumPreValue(d, i) / zoomRatio);
      })
      .attr('width', (d, i) => {
       if(i > 0) console.log('右', (accumValue(d, i) - accumPreValue(d, i))/zoomRatio)
        return (i == 0 ? accumValue(d, i)/zoomRatio : (accumValue(d, i) - accumPreValue(d, i)) / zoomRatio);
      })
      .attr('y', columnIndex * this.Y_BAR_INTERVAL)
      .attr('height', this.Y_BAR_THICK)
      .attr('class', `${group}`)
      ;

      // 文字
      greenBars
          .enter()
          .append("text")
          .attr("clip-path", d => d.key)
          .append("tspan")
          .attr('fill', 'white')
          .attr('font-size', '55%')
          .transition()
          .duration(1600)
          .attr('x', (d, rowIndex) => rowIndex == 0 ? (0 + (d.value / 10)) / zoomRatio : accumPreValue(d, rowIndex) / zoomRatio + (d.value / 10) / zoomRatio)
          .attr("y", columnIndex * this.Y_BAR_INTERVAL + (this.Y_BAR_THICK / 1.4))
          .text(d => `name: ${d.name} bound:${d.amount} value:${d.value}`)


      ;




      // Transition
      // greenBars
      // .transition()
      // .duration(1600)
      // .attr('x', (d , i) => (i == 0 ? 0 : accumPreValue(d, i) / zoomRatio))
      // .attr('width', (d, i) => d.value / zoomRatio)
      // .attr('y', columnIndex * this.Y_BAR_INTERVAL)
      // .attr('height', this.Y_BAR_THICK)
      // .attr('class', `${group}`)

      ;

    });

  }

  getAccumulatedGroupedData(groupedData) {
    return Object.entries(_.cloneDeep(groupedData))
    .map(entry => {
      for (let i = 0; i < entry[1].length; i++) {
        entry[1][i].value = (i - 1 < 0 ? Number(entry[1][i].value) : Number(entry[1][i].value) + Number(entry[1][i - 1].value));
      }
      let array = new Array(2);
      array[0] = entry[0];
      array[1] = entry[1];
      return array;
    })
    .reduce((a, b) => a.set(b[0], b[1]), new Map());
  }
}

JasmineD3BarChartDemo.propTypes = {
  data: PropTypes.arrayOf(PropTypes.any),
};

// function mapStateToProps() {
//
//
//
//
// }

// export default connect(mapStateToProps)(JasmineD3BarChartDemo);
