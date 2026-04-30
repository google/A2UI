//
//  GradientBarChartRenderer.swift
//  GenerativeUIClientSDK
//
//  Created by acoder-ai-infra on 2026/4/9.
//

import UIKit
import DGCharts

/// Custom bar chart renderer with gradient colors + bottom rounded corners
class GradientBarChartRenderer: BarChartRenderer {
    
    private let config: ChartStyleConfig
    
    init(dataProvider: BarChartDataProvider, animator: Animator, viewPortHandler: ViewPortHandler, config: ChartStyleConfig) {
        self.config = config
        super.init(dataProvider: dataProvider, animator: animator, viewPortHandler: viewPortHandler)
    }
    
    override func drawDataSet(context: CGContext, dataSet: BarChartDataSetProtocol, index: Int) {
        guard let dataProvider = dataProvider,
              let barData = dataProvider.barData else {
            return
        }
        
        let trans = dataProvider.getTransformer(forAxis: dataSet.axisDependency)
        let phaseX = animator.phaseX
        let phaseY = animator.phaseY
        
        let barWidthHalf = barData.barWidth / 2.0
        
        let entryCount = dataSet.entryCount
        let isStacked = dataSet.isStacked
        
        for entryIndex in 0..<Int(Double(entryCount) * phaseX) {
            guard let entry = dataSet.entryForIndex(entryIndex) as? BarChartDataEntry else {
                continue
            }
            
            let x = entry.x
            let y = entry.y
            
            if !isStacked {
                // Non-stacked bar chart
                var barRect = CGRect()
                
                let left = x - barWidthHalf
                let right = x + barWidthHalf
                let top = y >= 0 ? y : 0
                let bottom = y >= 0 ? 0 : y
                
                barRect.origin.x = CGFloat(left)
                barRect.size.width = CGFloat(right - left)
                barRect.origin.y = CGFloat(top)
                barRect.size.height = CGFloat(bottom - top)
                
                // Coordinate transformation
                trans.rectValueToPixel(&barRect)
                
                if !viewPortHandler.isInBoundsLeft(barRect.origin.x + barRect.size.width) {
                    continue
                }
                if !viewPortHandler.isInBoundsRight(barRect.origin.x) {
                    break
                }
                
                // Apply phaseY
                barRect.origin.y += barRect.size.height * CGFloat(1.0 - phaseY)
                barRect.size.height *= CGFloat(phaseY)
                
                // Calculate corner radius: top = half width, bottom = config value
                let barWidth = barRect.size.width
                let topCornerRadius = barWidth / 2.0
                let bottomCornerRadius = config.barCornerRadiusBottom
                
                context.saveGState()
                
                // Get bar color (cycling from colors array)
                let topColor = (dataSet as? BarChartDataSet)?.color(atIndex: entryIndex) ?? config.barGradientTopColor
                
                // Create gradient color
                let gradientColors = [topColor.cgColor, config.barGradientBottomColor.cgColor]
                let colorSpace = CGColorSpaceCreateDeviceRGB()
                let gradient = CGGradient(colorsSpace: colorSpace, colors: gradientColors as CFArray, locations: nil)!
                
                // Draw rounded rect path: top and bottom have rounded corners but different radii
                // Use custom path to set corners with different radii
                let path = UIBezierPath()
                let rect = barRect
                
                // Start from top-left corner, draw clockwise
                // Top-left corner (top rounded corner)
                path.addArc(withCenter: CGPoint(x: rect.minX + topCornerRadius, y: rect.minY + topCornerRadius),
                           radius: topCornerRadius,
                           startAngle: CGFloat.pi,
                           endAngle: CGFloat.pi * 1.5,
                           clockwise: true)
                // Top edge to top-right corner
                path.addLine(to: CGPoint(x: rect.maxX - topCornerRadius, y: rect.minY))
                // Top-right corner (top rounded corner)
                path.addArc(withCenter: CGPoint(x: rect.maxX - topCornerRadius, y: rect.minY + topCornerRadius),
                           radius: topCornerRadius,
                           startAngle: CGFloat.pi * 1.5,
                           endAngle: 0,
                           clockwise: true)
                // Right edge to bottom edge
                path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottomCornerRadius))
                // Bottom-right corner (bottom rounded corner)
                path.addArc(withCenter: CGPoint(x: rect.maxX - bottomCornerRadius, y: rect.maxY - bottomCornerRadius),
                           radius: bottomCornerRadius,
                           startAngle: 0,
                           endAngle: CGFloat.pi / 2,
                           clockwise: true)
                // Bottom edge to bottom-left corner
                path.addLine(to: CGPoint(x: rect.minX + bottomCornerRadius, y: rect.maxY))
                // Bottom-left corner (bottom rounded corner)
                path.addArc(withCenter: CGPoint(x: rect.minX + bottomCornerRadius, y: rect.maxY - bottomCornerRadius),
                           radius: bottomCornerRadius,
                           startAngle: CGFloat.pi / 2,
                           endAngle: CGFloat.pi,
                           clockwise: true)
                // Left edge back to start
                path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + topCornerRadius))
                path.close()
                
                // Clip path
                context.addPath(path.cgPath)
                context.clip()
                
                // Draw gradient (top to bottom)
                let startPoint = CGPoint(x: barRect.midX, y: barRect.minY)
                let endPoint = CGPoint(x: barRect.midX, y: barRect.maxY)
                context.drawLinearGradient(gradient, start: startPoint, end: endPoint, options: [])
                
                context.restoreGState()
            } else {
                // Stacked bar chart - fallback to default rendering
                super.drawDataSet(context: context, dataSet: dataSet, index: index)
                return
            }
        }
    }
    
    /// Override highlight drawing method, use rounded rectangle
    override open func drawHighlighted(context: CGContext, indices: [Highlight]) {
        guard let dataProvider = dataProvider,
              let barData = dataProvider.barData
        else { return }
        
        let phaseX = animator.phaseX
        let phaseY = animator.phaseY
        
        for high in indices {
            guard let dataSet = barData[high.dataSetIndex] as? BarChartDataSetProtocol
            else { continue }
            
            guard let e = dataSet.entryForXValue(high.x, closestToY: high.y, rounding: .up) as? BarChartDataEntry
            else { continue }
            
            let trans = dataProvider.getTransformer(forAxis: dataSet.axisDependency)
            let barWidthHalf = barData.barWidth / 2.0
            
            var barRect = CGRect()
            let x = e.x
            let y = e.y
            
            let left = x - barWidthHalf
            let right = x + barWidthHalf
            let top = y >= 0 ? y : 0
            let bottom = y >= 0 ? 0 : y
            
            barRect.origin.x = CGFloat(left)
            barRect.size.width = CGFloat(right - left)
            barRect.origin.y = CGFloat(top)
            barRect.size.height = CGFloat(bottom - top)
            
            // Coordinate transformation
            trans.rectValueToPixel(&barRect)
            
            if !viewPortHandler.isInBoundsLeft(barRect.origin.x + barRect.size.width) {
                continue
            }
            if !viewPortHandler.isInBoundsRight(barRect.origin.x) {
                break
            }
            
            // Apply phaseY
            barRect.origin.y += barRect.size.height * CGFloat(1.0 - phaseY)
            barRect.size.height *= CGFloat(phaseY)
            
            // Calculate corner radius: same as bars
            let barWidth = barRect.size.width
            let topCornerRadius = barWidth / 2.0
            let bottomCornerRadius = config.barCornerRadiusBottom
            
            // Get highlight color
            let highlightColor = dataSet.highlightColor
            let highlightAlpha = dataSet.highlightAlpha
            
            context.saveGState()
            context.setAlpha(highlightAlpha)
            
            // Create same rounded corner path as bar
            let path = UIBezierPath()
            let rect = barRect
            
            // Start from top-left corner, draw clockwise
            path.addArc(withCenter: CGPoint(x: rect.minX + topCornerRadius, y: rect.minY + topCornerRadius),
                       radius: topCornerRadius,
                       startAngle: CGFloat.pi,
                       endAngle: CGFloat.pi * 1.5,
                       clockwise: true)
            path.addLine(to: CGPoint(x: rect.maxX - topCornerRadius, y: rect.minY))
            path.addArc(withCenter: CGPoint(x: rect.maxX - topCornerRadius, y: rect.minY + topCornerRadius),
                       radius: topCornerRadius,
                       startAngle: CGFloat.pi * 1.5,
                       endAngle: 0,
                       clockwise: true)
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottomCornerRadius))
            path.addArc(withCenter: CGPoint(x: rect.maxX - bottomCornerRadius, y: rect.maxY - bottomCornerRadius),
                       radius: bottomCornerRadius,
                       startAngle: 0,
                       endAngle: CGFloat.pi / 2,
                       clockwise: true)
            path.addLine(to: CGPoint(x: rect.minX + bottomCornerRadius, y: rect.maxY))
            path.addArc(withCenter: CGPoint(x: rect.minX + bottomCornerRadius, y: rect.maxY - bottomCornerRadius),
                       radius: bottomCornerRadius,
                       startAngle: CGFloat.pi / 2,
                       endAngle: CGFloat.pi,
                       clockwise: true)
            path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + topCornerRadius))
            path.close()
            
            // Fill highlight color
            context.setFillColor(highlightColor.cgColor)
            context.addPath(path.cgPath)
            context.fillPath()
            
            context.restoreGState()
        }
    }
    
    /// Override value label drawing method to ensure text above bars displays correctly
    override open func drawValues(context: CGContext) {
        guard let dataProvider = dataProvider,
              let barData = dataProvider.barData
        else { return }
        
        let phaseY = animator.phaseY
        
        // Iterate through all data sets
        for i in 0..<barData.dataSetCount {
            guard let dataSet = barData[i] as? BarChartDataSetProtocol else { continue }
            
            // Check if value label drawing is enabled
            if !dataSet.isDrawValuesEnabled {
                continue
            }
            
            let valueFormatter = dataSet.valueFormatter
            let valueTextColor = dataSet.valueTextColor
            let valueFont = dataSet.valueFont
            let iconsOffset = dataSet.iconsOffset
            
            // Get transformer
            let trans = dataProvider.getTransformer(forAxis: dataSet.axisDependency)
            
            let entryCount = dataSet.entryCount
            let barWidthHalf = barData.barWidth / 2.0
            
            // Iterate through all data points
            for j in 0..<Int(Double(entryCount) * animator.phaseX) {
                guard let entry = dataSet.entryForIndex(j) as? BarChartDataEntry else { continue }
                
                let x = entry.x
                let y = entry.y
                
                // Calculate bar CGRect
                var barRect = CGRect()
                let left = x - barWidthHalf
                let right = x + barWidthHalf
                let top = y >= 0 ? y : 0
                let bottom = y >= 0 ? 0 : y
                
                barRect.origin.x = CGFloat(left)
                barRect.size.width = CGFloat(right - left)
                barRect.origin.y = CGFloat(top)
                barRect.size.height = CGFloat(bottom - top)
                
                // Coordinate transformation
                trans.rectValueToPixel(&barRect)
                
                // Check if within visible area
                if !viewPortHandler.isInBoundsLeft(barRect.origin.x + barRect.size.width) {
                    continue
                }
                if !viewPortHandler.isInBoundsRight(barRect.origin.x) {
                    break
                }
                if !viewPortHandler.isInBoundsTop(barRect.origin.y) {
                    continue
                }
                if !viewPortHandler.isInBoundsBottom(barRect.origin.y + barRect.size.height) {
                    continue
                }
                
                // Apply phaseY
                let barTopY = barRect.origin.y + barRect.size.height * CGFloat(1.0 - phaseY)
                
                // Get formatted text
                let valueText = valueFormatter.stringForValue(
                    y,
                    entry: entry,
                    dataSetIndex: i,
                    viewPortHandler: viewPortHandler
                )
                
                // Calculate text size
                let textAttributes: [NSAttributedString.Key: Any] = [.font: valueFont]
                let textSize = valueText.size(withAttributes: textAttributes)
                
                // Calculate text position: above bar top + offset
                let textX = barRect.origin.x + (barRect.size.width / 2.0) - (textSize.width / 2.0)
                let textY = barTopY - textSize.height - config.valueLabelOffset
                
                // Draw text
                context.saveGState()
                valueText.draw(at: CGPoint(x: textX, y: textY), withAttributes: textAttributes)
                context.restoreGState()
            }
        }
    }
}
