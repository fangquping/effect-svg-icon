// 获取路径详情
function elementPointsDetails(element) {
    const tagName = element.tagName.toLowerCase();
    const points = [];

    if (tagName === 'path') {
        const totalLength = element.getTotalLength();
        const step = 1; // 步长，可以调整以控制点的密度
        for (let i = 0; i <= totalLength; i += step) {
            const point = element.getPointAtLength(i);
            points.push({ x: point.x, y: point.y });
        }
    } else if (tagName === 'polygon' || tagName === 'polyline') {
        const pointList = element.points;
        for (let i = 0; i < pointList.numberOfItems; i++) {
            const point = pointList.getItem(i);
            points.push({ x: point.x, y: point.y });
        }
    } else if (tagName === 'rect') {
        const x = parseFloat(element.getAttribute('x')) || 0;
        const y = parseFloat(element.getAttribute('y')) || 0;
        const width = parseFloat(element.getAttribute('width')) || 0;
        const height = parseFloat(element.getAttribute('height')) || 0;

        points.push(
            { x, y },
            { x: x + width, y },
            { x: x + width, y: y + height },
            { x, y: y + height }
        );
    } else if (tagName === 'circle' || tagName === 'ellipse') {
        const cx = parseFloat(element.getAttribute('cx')) || 0;
        const cy = parseFloat(element.getAttribute('cy')) || 0;
        const rx = tagName === 'circle' 
            ? parseFloat(element.getAttribute('r')) || 0 
            : parseFloat(element.getAttribute('rx')) || 0;
        const ry = tagName === 'circle' 
            ? rx 
            : parseFloat(element.getAttribute('ry')) || 0;

        const numPoints = 64; // 点的数量，可以调整以控制点的密度
        for (let i = 0; i < numPoints; i++) {
            const angle = (2 * Math.PI * i) / numPoints;
            const x = cx + rx * Math.cos(angle);
            const y = cy + ry * Math.sin(angle);
            points.push({ x, y });
        }
    }

    return points;
}

// 检查路径是否封闭
function isPathClosed(path) {
    const pathData = path.getAttribute('d');
    return pathData.trim().endsWith('Z') || pathData.trim().endsWith('z');
}

// 计算路径的面积
function calculatePathArea(path) {
    const tagName = path.tagName.toLowerCase();

    if (tagName === 'circle') {
        const r = parseFloat(path.getAttribute('r')) || 0;
        return Math.PI * r * r; // 圆面积公式
    } else if (tagName === 'ellipse') {
        const rx = parseFloat(path.getAttribute('rx')) || 0;
        const ry = parseFloat(path.getAttribute('ry')) || 0;
        return Math.PI * rx * ry; // 椭圆面积公式
    }

    if (!isPathClosed(path)) return 0;
    const points = elementPointsDetails(path);
    const n = points.length;
    let area = 0;
    for (let i = 0; i < n; i++) {
        const { x: x1, y: y1 } = points[i];
        const { x: x2, y: y2 } = points[(i + 1) % n];
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) / 2; // 利用鞋带定理计算面积
}

// 计算路径周长
function calculatePathPerimeter(path) {
    const tagName = path.tagName.toLowerCase();

    if (tagName === 'circle') {
        const r = parseFloat(path.getAttribute('r')) || 0;
        return 2 * Math.PI * r; // 圆周长公式
    }

    let totalPerimeter = 0;
    const points = elementPointsDetails(path);
    const n = points.length;
    for (let i = 0; i < (isPathClosed(path) ? n : n - 1); i++) {
        const { x: x1, y: y1 } = points[i];
        const { x: x2, y: y2 } = points[(i + 1) % n];
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        totalPerimeter += distance;
    }
    return totalPerimeter;
}

// 获取路径的边界圆
function createInscribedCircle(element) {
    const NS = "http://www.w3.org/2000/svg";
    // 检查是否支持 getBBox 方法
    if (typeof element.getBBox !== 'function') {
        console.error('Element does not support getBBox.');
        return null;
    }
    // 获取元素的边界框
    const bbox = element.getBBox();
    const cx = bbox.x + bbox.width / 2; // 中心点 x 坐标
    const cy = bbox.y + bbox.height / 2; // 中心点 y 坐标
    const radius = Math.min(bbox.width, bbox.height) / 2; // 半径为最小边的一半
      
    // 创建内切圆
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'none');
      
    // 将内切圆添加到 SVG 中
    const svg = element.ownerSVGElement || element;
    svg.appendChild(circle);  
    return circle;
    }
