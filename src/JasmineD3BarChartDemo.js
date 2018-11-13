/* global _:true */

import React, {Component} from "react";
import es6BindAll from "es6bindall";
import _ from "lodash";
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
    this.scaling = currentMax => a => {
      let v = currentMax / 900;
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

    // Scale
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
    // Color Map
    this.colorMap = new Map();
    this.colorMap.set('Thomas', 'DodgerBlue');
    this.colorMap.set('Willy', 'DeepSkyBlue');
    this.colorMap.set('Tim', 'steelBlue');
    this.colorMap.set('Dennis', 'Turquoise');
    this.colorMap.set('Sunny', 'SlateBlue');
    this.colorMap.set('Naomi', 'RoyalBlue');
    this.colorMap.set('Gary', 'MediumBlue');
  }

  componentWillReceiveProps(nextProps) {
    console.log('nextData=(%o), stateDate=(%o)', nextProps.data, this.state.data)
    if (nextProps.data != this.state.data) {
      this.setState({data: nextProps.data}, () => {
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
// fetch('http://localhost:8080/customized/all')
    fetch('/customized/all')
    .then(res => res.json())
    .then(res => {
      this.setState({data: res}, () => {
        // return this.createChart();
      });

    }).catch(console.log)

  }

  componentDidUpdate() {
    this.svg.selectAll("*").remove();
    this.createChart();
  }

  render() {
    let uuidv4 = () =>
        ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );

    return (<div>
      <div>目前總和:{Number(Math.round(this.state.data.map(a => a.value).reduce((a, b) => Number(a) + Number(b), 0)).toFixed(2))}</div>
      <button
          className={'btn btn-primary'}
          onClick={e => {
            this.setState({
              data:
                  [...this.state.data,
                    Object.assign({},
                        // 選擇一筆複製
                        {...this.state.data[Math.round(Math.random() % this.state.data.length).toFixed(0)]},
                        // 修改內容
                        {
                          key: uuidv4(),
                          amount: Number(Math.round(Math.random() * 5 * 10000).toFixed(0)),
                          value: Number(Math.round(Math.random() * 10000000).toFixed(0))
                        })]
            }, () => {
            });
          }}>新增一筆
      </button>
      <div ref={'barChartRef'}></div>
    </div>);
  }

  createChart() {
    let groupedData = this.getGroupedData(this.state.data);
    console.log('分組後資料=(%o)', groupedData)
    if (!!groupedData) {
      let accumulatedGroupedData = this.getAccumulatedGroupedData(_.cloneDeep(groupedData));
      let upperBound = this.getUpperBound(accumulatedGroupedData);

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

        // Exit
        this.svg.selectAll('.rect')
        .exit()
        .remove();

        let accumulatedGroupedDatum = accumulatedGroupedData.get(group);
        let localUpperBound = accumulatedGroupedDatum.map(a => a.value).sort(this.DESC_COMPARATOR)[0];
        let zoomRatio = Number(upperBound) / 900;
        console.log('group=(%o), locally upperBound=(%o), Global upperBound=(%o), zoom Ratio=(%o)', group, localUpperBound, upperBound, zoomRatio);

        let isMinInGroup = d => {
          let groupedDatum = groupedData[`${group}`];
          let b1 = groupedDatum.sort((a, b) => a.value - b.value)[0].key == d.key;
          if (b1) {
            // console.log('最小', d, groupedDatum)
          }
          return b1;
        };

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
        .on("mouseover", (d, i) => this.handleMouseOver(d, i, data, columnIndex, group, isMinInGroup(d)))

        // 框線
        .attr('stroke', '#ffffff')
        .attr('stroke-dasharray', '1,2')
        .attr('stroke-linecap', 'butt')
        .attr('stroke-width', '1')
        // 動畫
        .transition()
        .duration(1600)
        .attr('x', (d, i) => {
          // if (i > 0) {
            console.log('左', (isMinInGroup(d) && i === 0 ? 0 : this.getAccPreValue(accumulatedGroupedDatum)(d, i) / zoomRatio))
          // }

          return (Object.is(isMinInGroup(d), true) && i === 0 ? 0 : this.getAccPreValue(accumulatedGroupedDatum)(d, i) / zoomRatio);
        })
        .attr('width', (d, i) => {
          if (i > 0) {
            // console.log('右', (accumValue(d, i) - accumPreValue(d, i)) / zoomRatio)
          }
          return (isMinInGroup(d) && i == 0 ? this.getAccCurrentValue(accumulatedGroupedDatum)(d, i) / zoomRatio : (this.getAccCurrentValue(accumulatedGroupedDatum)(d, i) - this.getAccPreValue(accumulatedGroupedDatum)(d, i)) / zoomRatio);
        })
        .attr('y', columnIndex * this.Y_BAR_INTERVAL)
        .attr('height', this.Y_BAR_THICK)
        .attr('class', `${group}`)
        ;

      });
    }
  }

  /**
   * 依照「依據保額等級分組後的資料」對value欄位做累計相加
   * 取得該群組中, 位於目前位置的資料(累計保額)
   * @param accumulatedGroupedDatum
   * @returns {function(*, *): *}
   */
  getAccCurrentValue(accumulatedGroupedDatum) {
    let accumValue = (d, i) => [...accumulatedGroupedDatum].filter(g => g.key == d.key)[0].value;
    return accumValue;
  }

  /**
   * 依照「依據保額等級分組後的資料」對value欄位做累計相加
   * 取得該群組中, 位於目前位置的前一筆(右)資料(累計保額)
   * @param accumulatedGroupedDatum
   * @returns {function(*, *): number}
   */
  getAccPreValue(accumulatedGroupedDatum) {
    let accumPreValue = (d, i) => {
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
    return accumPreValue;
  }

  /**
   * 依照「依據保額等級分組後的資料」對value欄位做累計相加
   * 取得該群組中, 位於目前位置的下一筆(右)資料(累計保額)
   * @param accumulatedGroupedDatum
   * @returns {function(*, *): (any[] | number)}
   */
  getAccNextValue(accumulatedGroupedDatum) {
    let accumNextValue = (d, i) => {
      return [...accumulatedGroupedDatum].map((g, index) => {
        if (g.key == d.key) {
          return [...accumulatedGroupedDatum][index + 1];
        } else {
          return null;
        }
      }).filter(a => a != null) || [{value: 900}][0].value;
    };
    return accumNextValue;
  }

  /**
   * 取得不分群組 最高的保額 (value)
   * @param accumulatedGroupedData
   * @returns {any}
   */
  getUpperBound(accumulatedGroupedData) {
    return [...accumulatedGroupedData]
    .map(a => a[1].map(b => b.value).sort(this.DESC_COMPARATOR)[0])
    .sort(this.DESC_COMPARATOR)[0];
  }

  /**
   * 依據保額等級分組後的資料
   */
  getGroupedData(data) {
    return _.groupBy(data, a => this.amountClassifior(a));
  }
  /**
   * 將「依據保額等級分組後的資料」對value欄位做累計相加
   * @param groupedData 依照保額等級分類的資料
   * @returns {Map<any, any>}
   */
  getAccumulatedGroupedData(groupedData) {
    return Object.entries(groupedData)
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


  /**
   * 滑鼠移至方塊後應處理
   * @param dd (d, i) => 中的 d
   * @param ii (d, i) => 中的 i
   * @param data 該保額等級的所有資料
   * @param columnIndex
   * @param group 所屬保額等級
   * @param isMini 是否為該等級中最低保額
   */
  handleMouseOver(dd, ii, data, columnIndex, group, isMini) {
    let selectAll = d3.selectAll(`[id^=onFocusBarTxt_]`);
    if (!!selectAll && selectAll.nodes().length > 0) {
      if(selectAll.nodes()[0].getAttribute('clip-path') != dd.key) {
          selectAll.remove();
      }
    }

    let groupedData = this.getGroupedData(this.state.data);
    let accumulatedGroupedData = this.getAccumulatedGroupedData(_.cloneDeep(groupedData));
    let upperBound = this.getUpperBound(accumulatedGroupedData);
    let zoomRatio = Number(upperBound) / 900;
    let x = (d, rowIndex) => Object.is(isMini, true) && rowIndex == 0 ? (0 + (d.value / 10)) / zoomRatio : this.getAccPreValue(accumulatedGroupedData.get(group))(d, rowIndex)
        / zoomRatio + (d.value / 10) / zoomRatio;
    let y = columnIndex * this.Y_BAR_INTERVAL + (this.Y_BAR_THICK / 1.4);
    // Specify where to put label of text
    // console.log('進入', d, i, data, group)
    let greenBars = this.svg.selectAll(`.rect`).data(data, d => d.key);
    if (!!greenBars) {
      greenBars
      .enter()
      .append("text")
      .attr('id', `onFocusBarTxt_${dd.key}`)
      .attr('class', 'barTxt')
      .attr("clip-path", dd.key)
      .append("tspan")
      .attr('fill', 'white')
      .attr('font-size', '55%')
      .transition()
      .duration(0)
      .attr('x', (d, i) => x(d, i))
      .attr("y", y)
      .text((d) => d == dd ? `name: ${dd.name} bound:${dd.amount} value:${dd.value}` : '')
      ;


    }
  }


}

JasmineD3BarChartDemo.propTypes = {
  data: PropTypes.arrayOf(PropTypes.any),
};
