/* global d3 */

d3.json('data.json', initialize);

const greys = d3.scaleLinear().domain([0, 4]).range(['#1b211d', '#ddda93']);

function initialize(data) {
  const importsByYear = [
    data.children[2].children[0],
    data.children[1].children[0],
    data.children[0].children[0],
    data.children[3].children[0],
  ];

  const compare = importsByYear[0];
  const years = ['2015', '2005', '1995', '1985'];

  importsByYear.forEach((year, i) => {
    year.children.forEach((continent, ci) => {
      continent.children.forEach((country, coi) => {
        const compareIndex = compare.children[ci].children.map(d => d.country).indexOf(country.country);
        const comparePoint = compare.children[ci].children[compareIndex];
        if (comparePoint && !comparePoint.priorValues) {
          comparePoint.priorValues = [];
        }
        if (comparePoint) {
          comparePoint.priorValues.push(country.adj_value);
        }
      });
      continent.children = continent.children.filter(d => d.adj_value > 10000);
    });
  });

  console.log(data);

  const treemap = d3.treemap()
        .size([1000, 800])
        .padding(10);

  const root = d3.hierarchy(importsByYear[0]);

  root.sum(d => d.adj_value);

  const treemapRendered = treemap(root);

  d3.select('svg')
        .selectAll('g.treecell')
        .data(treemapRendered.descendants())
        .enter()
        .append('g')
        .attr('class', 'treecell');

  d3.selectAll('g.treecell')
        .append('rect')
        .attr('transform', d => `translate(${d.x0},${d.y0})`)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .style('fill', '#e3cbbf')
        .style('stroke', '#977d5a')
        .style('stroke-width', '1px');

  d3.selectAll('g.treecell')
        .each(function (d) {
          d3.select(this)
                .append('text')
                .text(d.data.country)
                .attr('transform', d => `translate(${d.x0 + ((d.x1 - d.x0) / 2)},${d.y0})`)
                .style('text-anchor', 'middle');

          if (d.data && d.data.priorValues) {
            const data = squareCorners(d.data.adj_value, d.data.priorValues, d.x0, d.x1, d.y0, d.y1);

            d3.select(this)
                    .selectAll('path.cornervector')
                    .data(data)
                    .enter()
                    .append('path')
                    .attr('class', 'cornervector')
                    .attr('d', (p, i) => cornerVectors(p, i, data, d.x1, d.y1))
                    .style('fill', (p, i) => greys(i));

            d3.select(this)
                    .selectAll('path.corner')
                    .data(data)
                    .enter()
                    .append('path')
                    .attr('d', p => corner(p))
                    .style('stroke', '#151513')
                    .style('stroke-width', '2px')
                    .style('fill', 'none');
          }
        });
}

function squareCorners(initialValue, priorValues, x0, x1, y0, y1) {
  const priorPercent = priorValues.map(d => d / initialValue);
  const weightedMid = (d0, d1, weight) => d1 - ((d1 - d0) * weight);
  return priorPercent.map((d) => {
    const midX = weightedMid(x0, x1, d);
    const midY = weightedMid(y0, y1, d);
    return [Math.max(x0 - 4, midX), Math.max(y0 - 4, midY), x1 - midX, y1 - midY];
  });
}

function cornerVectors(c, ci, data, x1, y1) {
  const lastCorner = ci === 0 ? data[ci] : data[ci - 1];

  return `M${lastCorner[0]},${lastCorner[1] + (lastCorner[3] * 0.1)}L${lastCorner[0]},${lastCorner[1]}L${lastCorner[0] + (lastCorner[2] * 0.1)},${lastCorner[1]}L${c[0] + (c[2] * 0.1)},${c[1]}L${c[0]},${c[1]}L${c[0]},${c[1] + (c[3] * 0.1)}Z`;
}

function corner(coordinates) {
  return `M${coordinates[0]},${coordinates[1] + (coordinates[3] * 0.12)}L${coordinates[0]},${coordinates[1]}L${coordinates[0] + (coordinates[2] * 0.12)},${coordinates[1]}`;
}
