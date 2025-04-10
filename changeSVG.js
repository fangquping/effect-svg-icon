function loadSVG(file,callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
      const parser = new DOMParser();
      // 解析svg文件
      const svgDoc =parser.parseFromString(e.target.result, 'image/svg+xml');
      // 调用回调函数
      callback(svgDoc.documentElement);
  };
  reader.readAsText(file);
}

function saveSVG(svgElement, fileName = 'output.svg') {
      const serializer = new XMLSerializer();
      const svgBlob = new Blob([serializer.serializeToString(svgElement)], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = fileName;
      downloadLink.click();

      URL.revokeObjectURL(url); // 释放 URL 对象
  } 

// 设置渐变，使 SVG 中的 Path、圆或者矩形等都适用渐变
function applyElementGradient(elements) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = elements.ownerSVGElement || elements[0].ownerSVGElement;
  const defs = svg.querySelector('defs') || svg.insertBefore(
    document.createElementNS(NS, 'defs'), svg.firstChild
  );

  // 计算 SVG 整体画幅的对角线
  const svgBBox = svg.getBBox();
  const maxDiagonal = Math.sqrt(svgBBox.width ** 2 + svgBBox.height ** 2);

  let gradientIndex = 0;
  let patternIndex = 0;

  const applyGradientToElement = (element) => {
    const bbox = element.getBBox();
    const bottomRightX = bbox.x + bbox.width; // 右下角 X 坐标
    const bottomRightY = bbox.y + bbox.height; // 右下角 Y 坐标
    const diagonal = Math.sqrt(bottomRightX ** 2 + bottomRightY ** 2); // (0,0) 到右下角的距离
    const rValue = (maxDiagonal / diagonal) * 142; // 根据 SVG 画幅对角线计算 r 值

    const gradientId = 'radial-gradient-element-' + gradientIndex++;
    const gradient = document.createElementNS(NS, 'radialGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('cx', '0%');
    gradient.setAttribute('cy', '0%');
    gradient.setAttribute('r', `${rValue}%`);
    gradient.innerHTML = `
      <stop offset="0%" style="stop-color:transparent;stop-opacity:1" />
      <stop offset="71%" style="stop-color:black;stop-opacity:0.3" />
      <stop offset="85%" style="stop-color:white;stop-opacity:0.1" />
      <stop offset="100%" style="stop-color:grey;stop-opacity:0.5" />
    `;
    defs.appendChild(gradient);

    const originalFill = element.getAttribute('fill') || 'none';
    const patternId = 'pattern-element-' + patternIndex++;
    const pattern = document.createElementNS(NS, 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '100%');
    pattern.setAttribute('height', '100%');
    pattern.innerHTML = `
      <rect width="100%" height="100%" fill="${originalFill}" />
      <rect width="100%" height="100%" fill="url(#${gradientId})" />
    `;
    defs.appendChild(pattern);

    element.setAttribute('fill', `url(#${patternId})`);
  };

  if (Array.isArray(elements)) elements.forEach(path => applyGradientToElement(path));
  else applyGradientToElement(elements);
}

// 在元素左上角绘制高光图形
function addHighlight(element) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = element.ownerSVGElement;

    if (element.tagName === 'path') {
      // 如果是路径元素，按路径点生成高光
      const points = pathPoints(element).map(p => ({ x: p[0], y: p[1] })); // 转换为点数组
      const polygon = document.createElementNS(NS, 'polygon');
      polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' ')); // 生成多边形

      // 调用 createHighlightTriangles 生成高光三角形
      const triangles = createHighlightTriangles(polygon,  Math.random() * .618);
      // 在 SVG 中添加渐变定义
      const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);

      // 为三角形添加渐变
      const gradientId = 'path-gradient-' + Math.random().toString(36).substring(3, 11);
      const gradient = document.createElementNS(NS, 'linearGradient');
      gradient.setAttribute('id', gradientId);
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '14.6%');
      gradient.innerHTML = `
        <stop offset="0%" style="stop-color:transparent;stop-opacity:.0" />
        <stop offset="14.6%" style="stop-color:white;stop-opacity:.0" />
        <stop offset="38.2%" style="stop-color:white;stop-opacity:.75" />
        <stop offset="100%" style="stop-color:white;stop-opacity:.0" />
      `;
      defs.appendChild(gradient);

      // 为生成的三角形应用渐变
      triangles.forEach(triangle => {
        triangle.setAttribute('fill', `url(#${gradientId})`);
      });
      svg.appendChild(triangles[0]);
      svg.appendChild(triangles[1]);

    } else if (element.tagName === 'circle' || element.tagName === 'ellipse') {
        // 如果是圆形或椭圆元素，调用 createHighlightEllipse 函数
        const highlightEllipse = createHighlightEllipse(element);
        svg.appendChild(highlightEllipse);

        const gradientId = 'ellipse-gradient-' + Math.random().toString(36).substring(3, 11);
        const gradient = document.createElementNS(NS, 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '57.7%');
        gradient.innerHTML = `
          <stop offset="0%" style="stop-color:white;stop-opacity:.75" />
          <stop offset="61.8%" style="stop-color:white;stop-opacity:.0" />
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
        `;
        svg.querySelector('defs')?.appendChild(gradient) || svg.insertBefore(
          document.createElementNS(NS, 'defs'), svg.firstChild
        ).appendChild(gradient);

        highlightEllipse.setAttribute('fill', `url(#${gradientId})`);

    } else if (element.tagName === 'rect') {
        // 如果是矩形元素，绘制高光梯形
        const x = parseFloat(element.getAttribute('x')) || 0;
        const y = parseFloat(element.getAttribute('y')) || 0;
        const width = parseFloat(element.getAttribute('width'));
        const height = parseFloat(element.getAttribute('height'));

        const highlightPath = document.createElementNS(NS, 'polygon');
        const trapezoid = document.createElementNS(NS, 'polygon');
        // 计算梯形的四个顶点
        const points = [
          `${x},${y}`, // 左上角
          `${x + width *.1459},${y+height * .1459}`, // 左下角
          `${x + width *.8541},${y + height * .1459}`, // 右下角
          `${x + width},${y}` // 右上角
        ].join(' ');
        highlightPath.setAttribute('points', points);

        const gradientId = 'rect-highlight-gradient-' + Math.random().toString(36).substring(3, 11);
        const gradient = document.createElementNS(NS, 'linearGradient');
        gradient.setAttribute('id', gradientId);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');
        gradient.innerHTML = `
          <stop offset="0%" style="stop-color:transparent;stop-opacity:.0" />
          <stop offset="38.2%" style="stop-color:white;stop-opacity:.0" />
          <stop offset="61.8%" style="stop-color:white;stop-opacity:.75" />
          <stop offset="100%" style="stop-color:white;stop-opacity:.0" />
        `;
        svg.querySelector('defs')?.appendChild(gradient) || svg.insertBefore(
          document.createElementNS(NS, 'defs'), svg.firstChild
        ).appendChild(gradient);

        highlightPath.setAttribute('fill', `url(#${gradientId})`);

        const trapezoidpoints = [
          `${x},${y}`, // 左上角
          `${x},${y+height}`, // 左下角
          `${x + width *.1459},${y + height *.8541 }`, // 右下角
          `${x+ width *.1459},${y+height *.1459}` // 右上角
        ].join(' ');
        trapezoid.setAttribute('points', trapezoidpoints);

        const trapezoidGradientId = 'rect-trapezoid-gradient-' + Math.random().toString(36).substring(3, 11);
        const trapezoidGradient = document.createElementNS(NS, 'linearGradient');
        trapezoidGradient.setAttribute('id', trapezoidGradientId);
        trapezoidGradient.setAttribute('x1', '0%');
        trapezoidGradient.setAttribute('y1', '0%');
        trapezoidGradient.setAttribute('x2', '100%');
        trapezoidGradient.setAttribute('y2', '0%');
        trapezoidGradient.innerHTML = `
          <stop offset="0%" style="stop-color:transparent;stop-opacity:.0" />
          <stop offset="38.2%" style="stop-color:white;stop-opacity:.0" />
          <stop offset="61.8%" style="stop-color:white;stop-opacity:.75" />
          <stop offset="100%" style="stop-color:white;stop-opacity:.0" />
        `;
        svg.querySelector('defs')?.appendChild(trapezoidGradient) || svg.insertBefore(
          document.createElementNS(NS, 'defs'), svg.firstChild
        ).appendChild(trapezoidGradient);

        trapezoid.setAttribute('fill', `url(#${trapezoidGradientId})`);
        svg.appendChild(highlightPath);
        svg.appendChild(trapezoid);

    } else if (element.tagName === 'polygon') {
      // 如果是多边形元素，绘制高光三角形
      const triangles =createHighlightTriangles(element, .236);
      const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);

      // 为三角形添加渐变
      const gradientId1 = 'polygon-gradient-1-' + Math.random().toString(36).substring(3, 11);
      const gradient1 = document.createElementNS(NS, 'linearGradient');
      gradient1.setAttribute('id', gradientId1);
      gradient1.setAttribute('x1', '0%');
      gradient1.setAttribute('y1', '0%');
      gradient1.setAttribute('x2', '100%');
      gradient1.setAttribute('y2', '14.6%');
      gradient1.innerHTML = `
          <stop offset="0%" style="stop-color:transparent;stop-opacity:.0" />
          <stop offset="14.6%" style="stop-color:white;stop-opacity:.0" />
          <stop offset="61.8%" style="stop-color:white;stop-opacity:.75" />
          <stop offset="100%" style="stop-color:white;stop-opacity:.0" />
      `;
      defs.appendChild(gradient1);
      triangles[0].setAttribute('fill', `url(#${gradientId1})`);
      triangles[1].setAttribute('fill', `url(#${gradientId1})`);
      svg.appendChild(triangles[0]);
      svg.appendChild(triangles[1]);

    } else {
        console.error('Unsupported element type for highlighting:', element.tagName);
    }
}

// 创建高光椭圆，只接受圆形和椭圆
// 该函数会在圆形或椭圆的中间偏上位置添加一个高光椭圆
function createHighlightEllipse(element) {
    const NS = "http://www.w3.org/2000/svg";
    const cx = parseFloat(element.getAttribute('cx'));
    const cy = parseFloat(element.getAttribute('cy'));

    const rx = element.tagName === 'circle' 
        ? parseFloat(element.getAttribute('r')) * 0.54 
        : parseFloat(element.getAttribute('rx')) * 0.54;
    const ry = element.tagName === 'circle' 
        ? parseFloat(element.getAttribute('r')) * 0.23 
        : parseFloat(element.getAttribute('ry')) * 0.23;
    const offsetY = cy - 2 * ry;

    const highlightEllipse = document.createElementNS(NS, 'ellipse');
    highlightEllipse.setAttribute('cx', cx);
    highlightEllipse.setAttribute('cy', offsetY);
    highlightEllipse.setAttribute('rx', rx);
    highlightEllipse.setAttribute('ry', ry);
    return highlightEllipse;
}

// 获取路径的所有点
function pathPoints(path) {
  const points = [];
  for (let i = 0; i < path.getTotalLength(); i++) {
    const point = path.getPointAtLength(i);
    points.push([point.x, point.y]);
  }
  return points;
}

//创建高光三角形，只接受多边形
// 该函数会在多边形的左上角添加两个高光三角形
function createHighlightTriangles(polygon, rectHeightFactor = 0.05) {
  const NS = "http://www.w3.org/2000/svg";
  //const svg = polygon.ownerSVGElement;

  // 获取多边形的所有点
  const points = Array.from(polygon.points).map(point => ({ x: point.x, y: point.y }));

  // 直接找到左上角点的索引 (y 最小，若 y 相同则 x 最小)
  const topLeftIndex = points.reduce((minIndex, point, index) => {
    const minPoint = points[minIndex];
    if (point.y < minPoint.y || (point.y === minPoint.y && point.x < minPoint.x)) return index;
    return minIndex;
  }, 0);

  // 根据索引找到左上角点及其相邻的两条边的端点
  const topLeftPoint = points[topLeftIndex];
  let prevPoint = points[(topLeftIndex - 1 + points.length) % points.length];
  let nextPoint = points[(topLeftIndex + 1) % points.length];

  // 检测边是否与其他边有交点
  const findIntersection = (p1, p2, q1, q2) => {
    const det = (p2.x - p1.x) * (q2.y - q1.y) - (p2.y - p1.y) * (q2.x - q1.x);
    if (Math.abs(det) < 1e-10) return null; // 平行或共线，无交点

    const t = ((q1.x - p1.x) * (q2.y - q1.y) - (q1.y - p1.y) * (q2.x - q1.x)) / det;
    const u = ((q1.x - p1.x) * (p2.y - p1.y) - (q1.y - p1.y) * (p2.x - p1.x)) / det;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const intersection = {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };

        // 检查交点是否与输入点重合
        if (Math.abs(intersection.x - p1.x) < 1e-10 && Math.abs(intersection.y - p1.y) < 1e-10) {
            return null; // 忽略与 p1 重合的交点
        }
        return intersection;
    }
    return null; // 无交点
  };

  // 检查左上角点与其他边的交点
  for (let i = 0; i < points.length; i++) {
    const edgeStart = points[i];
    const edgeEnd = points[(i + 1) % points.length];

    if (edgeStart !== prevPoint && edgeEnd !== topLeftPoint) {
      const intersection = findIntersection(topLeftPoint, prevPoint, edgeStart, edgeEnd);
      if (intersection) {
        prevPoint = intersection; // 替换为交点
        break; // 找到交点后退出循环
      }
    }
  }

  for (let i = 0; i < points.length; i++) {
    const edgeStart = points[i];
    const edgeEnd = points[(i + 1) % points.length];

    if (edgeStart !== nextPoint && edgeEnd !== topLeftPoint) {
      const intersection = findIntersection(topLeftPoint, nextPoint, edgeStart, edgeEnd);
      if (intersection) {
        nextPoint = intersection; // 替换为交点
        break;
      }
    }
  }

  // 计算多边形的高度
  const polygonHeight = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y));
  const verticalOffset = polygonHeight * rectHeightFactor * Math.SQRT1_2; // 梯形竖直向下的边长度

  // 创建与前一个点的边平行的三角形
  let c= (prevPoint.x - topLeftPoint.x)**2 + (prevPoint.y - topLeftPoint.y)**2;
  let b= (nextPoint.x - topLeftPoint.x)**2 + (nextPoint.y - topLeftPoint.y)**2;
  let a= (prevPoint.x - nextPoint.x)**2 + (prevPoint.y - nextPoint.y)**2;
  let zero = 2*Math.sqrt(b)*Math.sqrt(c);
  let cosA=zero==0 ? -1 : (b+c-a)/zero;// 余弦定理计算左上点张角
  const cos_halfA =Math.sqrt((cosA+1)/2);
  const sin_halfA = Math.sqrt((1-cosA)/2);
  // 计算半角的余弦和正弦值
  
  const triangle1 = document.createElementNS(NS, 'polygon');
  const triangle1Points = [
    { x: prevPoint.x, y: prevPoint.y },
    { x: topLeftPoint.x, y: topLeftPoint.y },
    { x: topLeftPoint.x + verticalOffset * cos_halfA , y: topLeftPoint.y + verticalOffset * sin_halfA}, // 角平分线方向
  ];
  triangle1.setAttribute('points', triangle1Points.map(p => `${p.x},${p.y}`).join(' '));
  triangle1.setAttribute('name', 'polygonHighlightTriangle');

  // 创建与下一个点的边平行的三角形
  const triangle2 = document.createElementNS(NS, 'polygon');
  const triangle2Points = [
    { x: nextPoint.x, y: nextPoint.y },
    { x: topLeftPoint.x, y: topLeftPoint.y },
    { x: topLeftPoint.x + verticalOffset * cos_halfA , y: topLeftPoint.y + verticalOffset * sin_halfA}, // 角平分线方向
  ];
  triangle2.setAttribute('points', triangle2Points.map(p => `${p.x},${p.y}`).join(' '));
  triangle2.setAttribute('name', 'polygonHighlightTriangle');

  if (nextPoint.x > prevPoint.x) return [triangle1, triangle2];
  // 如果 nextPoint 在 prevPoint 的左侧，交换顺序
  else return [triangle2, triangle1];
  // 先返回左侧的三角形形
}
