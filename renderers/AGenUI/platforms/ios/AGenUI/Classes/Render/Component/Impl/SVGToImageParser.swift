//
//  SVGToImageParser.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/22.
//

import Foundation
import UIKit

class SVGToImageParser {
    
    static let shared = SVGToImageParser()
    
    /// Load SVG file from AGenUIResource.bundle and convert to UIImage
    /// - Parameters:
    ///   - name: SVG filename (with or without .svg extension)
    ///   - size: Target image size
    ///   - tintColor: Stroke color
    /// - Returns: UIImage or nil
    func loadSVG(named name: String, size: CGSize, tintColor: UIColor = .black) -> UIImage? {
        let fileName = name.replacingOccurrences(of: ".svg", with: "")
        
        guard let bundleURL = Bundle.main.url(forResource: "AGenUI", withExtension: "bundle"),
              let bundle = Bundle(url: bundleURL),
              let svgURL = bundle.url(forResource: fileName, withExtension: "svg"),
              let data = try? Data(contentsOf: svgURL) else {
            return nil
        }
        
        let svgParser = SVGXMLParser(data: data)
        let shapes = svgParser.parse()
        
        let viewBox = svgParser.viewBox ?? CGRect(x: 0, y: 0, width: svgParser.svgWidth ?? 24, height: svgParser.svgHeight ?? 24)
        
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { context in
            let cgContext = context.cgContext
            
            let scaleX = size.width / viewBox.width
            let scaleY = size.height / viewBox.height
            cgContext.scaleBy(x: scaleX, y: scaleY)
            cgContext.translateBy(x: -viewBox.origin.x, y: -viewBox.origin.y)
            
            for shape in shapes {
                let path = shape.path
                
                // Fill: nil means currentColor, use tintColor; clear means fill="none"
                let resolvedFillColor = shape.fillColor ?? tintColor
                if resolvedFillColor != UIColor.clear {
                    resolvedFillColor.setFill()
                    path.fill()
                }
                
                // Stroke: nil means currentColor, use tintColor; clear means no stroke
                let resolvedStrokeColor = shape.strokeColor ?? tintColor
                if resolvedStrokeColor != UIColor.clear {
                    resolvedStrokeColor.setStroke()
                    path.lineWidth = shape.strokeWidth ?? 2
                    path.lineCapStyle = shape.lineCap ?? .round
                    path.lineJoinStyle = shape.lineJoin ?? .round
                    path.stroke()
                }
            }
        }
    }
}

// MARK: - Model
struct SVGShape {
    let path: UIBezierPath
    var fillColor: UIColor?
    var strokeColor: UIColor?
    var strokeWidth: CGFloat?
    var lineCap: CGLineCap?
    var lineJoin: CGLineJoin?
}

// MARK: - XML Parser
class SVGXMLParser: NSObject, XMLParserDelegate {
    private let parser: XMLParser
    private var shapes: [SVGShape] = []
    var viewBox: CGRect?
    var svgWidth: CGFloat?
    var svgHeight: CGFloat?
    
    // Global style properties (inherited from <svg> root element)
    private var globalFill: String?
    private var globalStroke: String?
    private var globalStrokeWidth: CGFloat?
    private var globalLineCap: CGLineCap?
    private var globalLineJoin: CGLineJoin?
    
    init(data: Data) {
        self.parser = XMLParser(data: data)
        super.init()
        self.parser.delegate = self
    }
    
    func parse() -> [SVGShape] {
        parser.parse()
        return shapes
    }
    
    // MARK: - Style parsing helper methods
    
    private func parseLineCap(_ value: String) -> CGLineCap {
        switch value {
        case "round": return .round
        case "square": return .square
        default: return .butt
        }
    }
    
    private func parseLineJoin(_ value: String) -> CGLineJoin {
        switch value {
        case "round": return .round
        case "bevel": return .bevel
        default: return .miter
        }
    }
    
    private func parseSVGColor(_ value: String) -> UIColor? {
        if value == "none" { return UIColor.clear }
        if value == "currentColor" { return nil }
        if value.hasPrefix("#") { return colorFromHex(value) }
        switch value.lowercased() {
        case "black": return .black
        case "white": return .white
        case "red": return .red
        case "green": return .green
        case "blue": return .blue
        case "yellow": return .yellow
        case "gray", "grey": return .gray
        case "orange": return .orange
        case "purple": return .purple
        default: return nil
        }
    }
    
    private func colorFromHex(_ hex: String) -> UIColor? {
        var hexString = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if hexString.hasPrefix("#") { hexString.removeFirst() }
        
        var rgb: UInt64 = 0
        Scanner(string: hexString).scanHexInt64(&rgb)
        
        switch hexString.count {
        case 3:
            return UIColor(
                red: CGFloat((rgb >> 8) & 0xF) / 15.0,
                green: CGFloat((rgb >> 4) & 0xF) / 15.0,
                blue: CGFloat(rgb & 0xF) / 15.0, alpha: 1.0)
        case 6:
            return UIColor(
                red: CGFloat((rgb >> 16) & 0xFF) / 255.0,
                green: CGFloat((rgb >> 8) & 0xFF) / 255.0,
                blue: CGFloat(rgb & 0xFF) / 255.0, alpha: 1.0)
        case 8:
            return UIColor(
                red: CGFloat((rgb >> 24) & 0xFF) / 255.0,
                green: CGFloat((rgb >> 16) & 0xFF) / 255.0,
                blue: CGFloat((rgb >> 8) & 0xFF) / 255.0,
                alpha: CGFloat(rgb & 0xFF) / 255.0)
        default:
            return nil
        }
    }
    
    /// Extract style from element attributes, unspecified properties inherit global style
    private func extractShapeStyle(from attributes: [String: String]) -> (fillColor: UIColor?, strokeColor: UIColor?, strokeWidth: CGFloat?, lineCap: CGLineCap?, lineJoin: CGLineJoin?) {
        let fillColor: UIColor? = {
            if let v = attributes["fill"] { return parseSVGColor(v) }
            if let v = globalFill { return parseSVGColor(v) }
            return nil
        }()
        let strokeColor: UIColor? = {
            if let v = attributes["stroke"] { return parseSVGColor(v) }
            if let v = globalStroke { return parseSVGColor(v) }
            return nil
        }()
        let strokeWidth: CGFloat? = {
            if let v = attributes["stroke-width"], let w = Double(v) { return CGFloat(w) }
            return globalStrokeWidth
        }()
        let lineCap: CGLineCap? = {
            if let v = attributes["stroke-linecap"] { return parseLineCap(v) }
            return globalLineCap
        }()
        let lineJoin: CGLineJoin? = {
            if let v = attributes["stroke-linejoin"] { return parseLineJoin(v) }
            return globalLineJoin
        }()
        return (fillColor, strokeColor, strokeWidth, lineCap, lineJoin)
    }
    
    private func makeShape(path: UIBezierPath, attributes: [String: String]) -> SVGShape {
        let style = extractShapeStyle(from: attributes)
        return SVGShape(
            path: path,
            fillColor: style.fillColor,
            strokeColor: style.strokeColor,
            strokeWidth: style.strokeWidth,
            lineCap: style.lineCap,
            lineJoin: style.lineJoin
        )
    }
    
    // MARK: - XMLParserDelegate
    
    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String : String] = [:]) {
        
        if elementName == "svg" {
            if let vb = attributeDict["viewBox"] {
                let nums = vb.split(separator: " ").compactMap { Double($0) }
                if nums.count == 4 {
                    viewBox = CGRect(x: nums[0], y: nums[1], width: nums[2], height: nums[3])
                }
            }
            if let w = attributeDict["width"], let wv = Double(w) { svgWidth = CGFloat(wv) }
            if let h = attributeDict["height"], let hv = Double(h) { svgHeight = CGFloat(hv) }
            if viewBox == nil, let w = svgWidth, let h = svgHeight {
                viewBox = CGRect(x: 0, y: 0, width: w, height: h)
            }
            globalFill = attributeDict["fill"]
            globalStroke = attributeDict["stroke"]
            if let v = attributeDict["stroke-width"], let w = Double(v) { globalStrokeWidth = CGFloat(w) }
            if let v = attributeDict["stroke-linecap"] { globalLineCap = parseLineCap(v) }
            if let v = attributeDict["stroke-linejoin"] { globalLineJoin = parseLineJoin(v) }
        }
        
        if elementName == "path", let d = attributeDict["d"] {
            let path = parsePathData(d)
            shapes.append(makeShape(path: path, attributes: attributeDict))
        }
        
        if elementName == "rect" {
            let x = CGFloat(Double(attributeDict["x"] ?? "0") ?? 0)
            let y = CGFloat(Double(attributeDict["y"] ?? "0") ?? 0)
            let w = CGFloat(Double(attributeDict["width"] ?? "0") ?? 0)
            let h = CGFloat(Double(attributeDict["height"] ?? "0") ?? 0)
            let rx = CGFloat(Double(attributeDict["rx"] ?? "0") ?? 0)
            let ry = CGFloat(Double(attributeDict["ry"] ?? attributeDict["rx"] ?? "0") ?? 0)
            
            let rect = CGRect(x: x, y: y, width: w, height: h)
            let rectPath: UIBezierPath
            if rx == ry {
                rectPath = UIBezierPath(roundedRect: rect, cornerRadius: rx)
            } else {
                rectPath = UIBezierPath(roundedRect: rect, byRoundingCorners: .allCorners, cornerRadii: CGSize(width: rx, height: ry))
            }
            shapes.append(makeShape(path: rectPath, attributes: attributeDict))
        }
        
        if elementName == "circle" {
            let cx = CGFloat(Double(attributeDict["cx"] ?? "0") ?? 0)
            let cy = CGFloat(Double(attributeDict["cy"] ?? "0") ?? 0)
            let r = CGFloat(Double(attributeDict["r"] ?? "0") ?? 0)
            let circlePath = UIBezierPath(arcCenter: CGPoint(x: cx, y: cy), radius: r, startAngle: 0, endAngle: .pi * 2, clockwise: true)
            shapes.append(makeShape(path: circlePath, attributes: attributeDict))
        }
        
        if elementName == "ellipse" {
            let cx = CGFloat(Double(attributeDict["cx"] ?? "0") ?? 0)
            let cy = CGFloat(Double(attributeDict["cy"] ?? "0") ?? 0)
            let rx = CGFloat(Double(attributeDict["rx"] ?? "0") ?? 0)
            let ry = CGFloat(Double(attributeDict["ry"] ?? "0") ?? 0)
            let ellipsePath = UIBezierPath(ovalIn: CGRect(x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2))
            shapes.append(makeShape(path: ellipsePath, attributes: attributeDict))
        }
        
        if elementName == "line" {
            let x1 = CGFloat(Double(attributeDict["x1"] ?? "0") ?? 0)
            let y1 = CGFloat(Double(attributeDict["y1"] ?? "0") ?? 0)
            let x2 = CGFloat(Double(attributeDict["x2"] ?? "0") ?? 0)
            let y2 = CGFloat(Double(attributeDict["y2"] ?? "0") ?? 0)
            let linePath = UIBezierPath()
            linePath.move(to: CGPoint(x: x1, y: y1))
            linePath.addLine(to: CGPoint(x: x2, y: y2))
            shapes.append(makeShape(path: linePath, attributes: attributeDict))
        }
    }
    
    // MARK: - Complete SVG Path Parser
    
    /// Check if next token is a number (not a command letter), to detect implicit repeated parameters
    private func isNumber(at index: Int, in tokens: [String]) -> Bool {
        guard index < tokens.count else { return false }
        return Double(tokens[index]) != nil
    }
    
    private func parsePathData(_ d: String) -> UIBezierPath {
        let path = UIBezierPath()
        var currentPoint = CGPoint.zero
        var subpathStart = CGPoint.zero
        var lastControlPoint: CGPoint?
        
        let tokens = tokenize(d)
        var i = 0
        
        while i < tokens.count {
            let cmd = tokens[i]
            i += 1
            
            let isRelative = cmd.first?.isLowercase ?? false
            let command = cmd.uppercased()
            
            switch command {
            // MARK: MoveTo (additional coordinate pairs after M as implicit L/l)
            case "M":
                var isFirstPair = true
                while isNumber(at: i, in: tokens) && i + 1 < tokens.count,
                      let xVal = Double(tokens[i]),
                      let yVal = Double(tokens[i + 1]) {
                    var x = xVal
                    var y = yVal
                    if isRelative {
                        x += Double(currentPoint.x)
                        y += Double(currentPoint.y)
                    }
                    currentPoint = CGPoint(x: x, y: y)
                    if isFirstPair {
                        subpathStart = currentPoint
                        path.move(to: currentPoint)
                        isFirstPair = false
                    } else {
                        path.addLine(to: currentPoint)
                    }
                    i += 2
                    lastControlPoint = nil
                }
                
            // MARK: LineTo
            case "L":
                while isNumber(at: i, in: tokens) && i + 1 < tokens.count,
                      let xVal = Double(tokens[i]),
                      let yVal = Double(tokens[i + 1]) {
                    var x = xVal
                    var y = yVal
                    if isRelative {
                        x += Double(currentPoint.x)
                        y += Double(currentPoint.y)
                    }
                    currentPoint = CGPoint(x: x, y: y)
                    path.addLine(to: currentPoint)
                    i += 2
                    lastControlPoint = nil
                }
                
            // MARK: Horizontal Line
            case "H":
                while isNumber(at: i, in: tokens),
                      let xVal = Double(tokens[i]) {
                    var x = xVal
                    if isRelative {
                        x += Double(currentPoint.x)
                    }
                    currentPoint = CGPoint(x: x, y: currentPoint.y)
                    path.addLine(to: currentPoint)
                    i += 1
                    lastControlPoint = nil
                }
                
            // MARK: Vertical Line
            case "V":
                while isNumber(at: i, in: tokens),
                      let yVal = Double(tokens[i]) {
                    var y = yVal
                    if isRelative {
                        y += Double(currentPoint.y)
                    }
                    currentPoint = CGPoint(x: currentPoint.x, y: y)
                    path.addLine(to: currentPoint)
                    i += 1
                    lastControlPoint = nil
                }
                
            // MARK: Cubic Bezier Curve
            case "C":
                while isNumber(at: i, in: tokens) && i + 5 < tokens.count,
                      let x1Val = Double(tokens[i]),
                      let y1Val = Double(tokens[i + 1]),
                      let x2Val = Double(tokens[i + 2]),
                      let y2Val = Double(tokens[i + 3]),
                      let xVal = Double(tokens[i + 4]),
                      let yVal = Double(tokens[i + 5]) {
                    var x1 = x1Val, y1 = y1Val
                    var x2 = x2Val, y2 = y2Val
                    var x = xVal, y = yVal
                    
                    if isRelative {
                        x1 += Double(currentPoint.x); y1 += Double(currentPoint.y)
                        x2 += Double(currentPoint.x); y2 += Double(currentPoint.y)
                        x += Double(currentPoint.x); y += Double(currentPoint.y)
                    }
                    
                    let cp1 = CGPoint(x: x1, y: y1)
                    let cp2 = CGPoint(x: x2, y: y2)
                    let endPoint = CGPoint(x: x, y: y)
                    
                    path.addCurve(to: endPoint, controlPoint1: cp1, controlPoint2: cp2)
                    currentPoint = endPoint
                    lastControlPoint = cp2
                    i += 6
                }
                
            // MARK: Smooth Cubic Bezier
            case "S":
                while isNumber(at: i, in: tokens) && i + 3 < tokens.count,
                      let x2Val = Double(tokens[i]),
                      let y2Val = Double(tokens[i + 1]),
                      let xVal = Double(tokens[i + 2]),
                      let yVal = Double(tokens[i + 3]) {
                    var x2 = x2Val, y2 = y2Val
                    var x = xVal, y = yVal
                    
                    if isRelative {
                        x2 += Double(currentPoint.x); y2 += Double(currentPoint.y)
                        x += Double(currentPoint.x); y += Double(currentPoint.y)
                    }
                    
                    let cp1: CGPoint
                    if let lastCP = lastControlPoint {
                        cp1 = CGPoint(x: 2 * currentPoint.x - lastCP.x, y: 2 * currentPoint.y - lastCP.y)
                    } else {
                        cp1 = currentPoint
                    }
                    
                    let cp2 = CGPoint(x: x2, y: y2)
                    let endPoint = CGPoint(x: x, y: y)
                    
                    path.addCurve(to: endPoint, controlPoint1: cp1, controlPoint2: cp2)
                    currentPoint = endPoint
                    lastControlPoint = cp2
                    i += 4
                }
                
            // MARK: Quadratic Bezier Curve
            case "Q":
                while isNumber(at: i, in: tokens) && i + 3 < tokens.count,
                      let x1Val = Double(tokens[i]),
                      let y1Val = Double(tokens[i + 1]),
                      let xVal = Double(tokens[i + 2]),
                      let yVal = Double(tokens[i + 3]) {
                    var x1 = x1Val, y1 = y1Val
                    var x = xVal, y = yVal
                    
                    if isRelative {
                        x1 += Double(currentPoint.x); y1 += Double(currentPoint.y)
                        x += Double(currentPoint.x); y += Double(currentPoint.y)
                    }
                    
                    let cp = CGPoint(x: x1, y: y1)
                    let endPoint = CGPoint(x: x, y: y)
                    
                    path.addQuadCurve(to: endPoint, controlPoint: cp)
                    currentPoint = endPoint
                    lastControlPoint = cp
                    i += 4
                }
                
            // MARK: Smooth Quadratic Bezier
            case "T":
                while isNumber(at: i, in: tokens) && i + 1 < tokens.count,
                      let xVal = Double(tokens[i]),
                      let yVal = Double(tokens[i + 1]) {
                    var x = xVal, y = yVal
                    
                    if isRelative {
                        x += Double(currentPoint.x); y += Double(currentPoint.y)
                    }
                    
                    let cp: CGPoint
                    if let lastCP = lastControlPoint {
                        cp = CGPoint(x: 2 * currentPoint.x - lastCP.x, y: 2 * currentPoint.y - lastCP.y)
                    } else {
                        cp = currentPoint
                    }
                    
                    let endPoint = CGPoint(x: x, y: y)
                    path.addQuadCurve(to: endPoint, controlPoint: cp)
                    currentPoint = endPoint
                    lastControlPoint = cp
                    i += 2
                }
                
            // MARK: Arc
            case "A":
                while isNumber(at: i, in: tokens) && i + 6 < tokens.count,
                      let rxVal = Double(tokens[i]),
                      let ryVal = Double(tokens[i + 1]),
                      let rotationVal = Double(tokens[i + 2]),
                      let largeArcVal = Int(tokens[i + 3]),
                      let sweepVal = Int(tokens[i + 4]),
                      let xVal = Double(tokens[i + 5]),
                      let yVal = Double(tokens[i + 6]) {
                    let rx = CGFloat(rxVal)
                    let ry = CGFloat(ryVal)
                    let xAxisRotation = CGFloat(rotationVal) * .pi / 180
                    let largeArcFlag = largeArcVal == 1
                    let sweepFlag = sweepVal == 1
                    var x = xVal, y = yVal
                    
                    if isRelative {
                        x += Double(currentPoint.x); y += Double(currentPoint.y)
                    }
                    
                    let endPoint = CGPoint(x: x, y: y)
                    addArc(to: path, from: currentPoint, to: endPoint, rx: rx, ry: ry,
                           xAxisRotation: xAxisRotation, largeArcFlag: largeArcFlag, sweepFlag: sweepFlag)
                    currentPoint = endPoint
                    lastControlPoint = nil
                    i += 7
                }
                
            // MARK: ClosePath
            case "Z":
                path.close()
                currentPoint = subpathStart
                lastControlPoint = nil
                
            default:
                break
            }
        }
        
        return path
    }
    
    // MARK: - Arc implementation
    
    private func addArc(to path: UIBezierPath, from start: CGPoint, to end: CGPoint,
                       rx: CGFloat, ry: CGFloat, xAxisRotation: CGFloat,
                       largeArcFlag: Bool, sweepFlag: Bool) {
        
        if start == end { return }
        
        if rx == 0 || ry == 0 {
            path.addLine(to: end)
            return
        }
        
        var rx = abs(rx)
        var ry = abs(ry)
        
        let cosRotation = cos(xAxisRotation)
        let sinRotation = sin(xAxisRotation)
        
        let dx = (start.x - end.x) / 2
        let dy = (start.y - end.y) / 2
        let x1Prime = cosRotation * dx + sinRotation * dy
        let y1Prime = -sinRotation * dx + cosRotation * dy
        
        let lambda = (x1Prime * x1Prime) / (rx * rx) + (y1Prime * y1Prime) / (ry * ry)
        if lambda > 1 {
            rx *= sqrt(lambda)
            ry *= sqrt(lambda)
        }
        
        let sign: CGFloat = largeArcFlag == sweepFlag ? -1 : 1
        let sq = max(0, (rx * rx * ry * ry - rx * rx * y1Prime * y1Prime - ry * ry * x1Prime * x1Prime) /
                        (rx * rx * y1Prime * y1Prime + ry * ry * x1Prime * x1Prime))
        let coef = sign * sqrt(sq)
        let cxPrime = coef * rx * y1Prime / ry
        let cyPrime = -coef * ry * x1Prime / rx
        
        let cx = cosRotation * cxPrime - sinRotation * cyPrime + (start.x + end.x) / 2
        let cy = sinRotation * cxPrime + cosRotation * cyPrime + (start.y + end.y) / 2
        
        let theta1 = atan2((y1Prime - cyPrime) / ry, (x1Prime - cxPrime) / rx)
        let theta2 = atan2((-y1Prime - cyPrime) / ry, (-x1Prime - cxPrime) / rx)
        
        var dtheta = theta2 - theta1
        
        if sweepFlag && dtheta < 0 {
            dtheta += 2 * .pi
        } else if !sweepFlag && dtheta > 0 {
            dtheta -= 2 * .pi
        }
        
        let segments = max(1, Int(ceil(abs(dtheta) / (.pi / 2))))
        let delta = dtheta / CGFloat(segments)
        let alpha = sin(delta) * (sqrt(4 + 3 * tan(delta / 2) * tan(delta / 2)) - 1) / 3
        
        var theta = theta1
        
        for _ in 0..<segments {
            let nextTheta = theta + delta
            
            let cosTheta = cos(theta)
            let sinTheta = sin(theta)
            let cosNextTheta = cos(nextTheta)
            let sinNextTheta = sin(nextTheta)
            
            let q1x = cosTheta - sinTheta * alpha
            let q1y = sinTheta + cosTheta * alpha
            let q2x = cosNextTheta + sinNextTheta * alpha
            let q2y = sinNextTheta - cosNextTheta * alpha
            
            let cp1xEllipse = rx * q1x
            let cp1yEllipse = ry * q1y
            let cp2xEllipse = rx * q2x
            let cp2yEllipse = ry * q2y
            let endXEllipse = rx * cosNextTheta
            let endYEllipse = ry * sinNextTheta
            
            let cp1 = CGPoint(
                x: cosRotation * cp1xEllipse - sinRotation * cp1yEllipse + cx,
                y: sinRotation * cp1xEllipse + cosRotation * cp1yEllipse + cy
            )
            let cp2 = CGPoint(
                x: cosRotation * cp2xEllipse - sinRotation * cp2yEllipse + cx,
                y: sinRotation * cp2xEllipse + cosRotation * cp2yEllipse + cy
            )
            let endPoint = CGPoint(
                x: cosRotation * endXEllipse - sinRotation * endYEllipse + cx,
                y: sinRotation * endXEllipse + cosRotation * endYEllipse + cy
            )
            
            path.addCurve(to: endPoint, controlPoint1: cp1, controlPoint2: cp2)
            
            theta = nextTheta
        }
    }
    
    // MARK: - Improved Tokenize
    
    private func tokenize(_ d: String) -> [String] {
        var tokens: [String] = []
        var currentToken = ""
        var i = d.startIndex
        var hasDecimalPoint = false
        
        while i < d.endIndex {
            let char = d[i]
            
            if "MmLlHhVvCcSsQqTtAaZz".contains(char) {
                if !currentToken.isEmpty {
                    tokens.append(currentToken)
                    currentToken = ""
                    hasDecimalPoint = false
                }
                tokens.append(String(char))
            } else if char.isNumber || char == "." || char == "-" || char == "+" || char == "e" || char == "E" {
                if char == "." {
                    if hasDecimalPoint && !currentToken.isEmpty {
                        tokens.append(currentToken)
                        currentToken = String(char)
                        hasDecimalPoint = true
                    } else {
                        currentToken.append(char)
                        hasDecimalPoint = true
                    }
                } else if char == "-" || char == "+" {
                    let lastChar = currentToken.last
                    if !currentToken.isEmpty && lastChar != "e" && lastChar != "E" {
                        tokens.append(currentToken)
                        currentToken = String(char)
                        hasDecimalPoint = false
                    } else {
                        currentToken.append(char)
                    }
                } else if char == "e" || char == "E" {
                    currentToken.append(char)
                } else {
                    currentToken.append(char)
                }
            } else if char == "," || char.isWhitespace {
                if !currentToken.isEmpty {
                    tokens.append(currentToken)
                    currentToken = ""
                    hasDecimalPoint = false
                }
            }
            
            i = d.index(after: i)
        }
        
        if !currentToken.isEmpty {
            tokens.append(currentToken)
        }
        
        return tokens
    }
}
