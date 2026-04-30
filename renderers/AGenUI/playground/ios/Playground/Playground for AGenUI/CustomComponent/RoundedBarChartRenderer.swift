//
//  RoundedBarChartRenderer.swift
//  GenerativeUIClientSDK
//
//  Created by acoder-ai-infra on 2026/3/30.
//

import UIKit
import DGCharts

/// Custom bar chart renderer with rounded bars
/// Corner radius is half bar width, making bar top semi-circular
class RoundedBarChartRenderer: BarChartRenderer {

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

                // Calculate corner radius = half bar width
                let cornerRadius = barRect.size.width / 2.0

                context.saveGState()

                // Set fill color
                if let color = dataSet.color(atIndex: entryIndex).cgColor as CGColor? {
                    context.setFillColor(color)
                }

                // Draw rounded rectangle (only top two corners rounded)
                let roundedCorners: UIRectCorner = y >= 0 ? [.topLeft, .topRight] : [.bottomLeft, .bottomRight]
                let path = UIBezierPath(
                    roundedRect: barRect,
                    byRoundingCorners: roundedCorners,
                    cornerRadii: CGSize(width: cornerRadius, height: cornerRadius)
                )
                context.addPath(path.cgPath)
                context.fillPath()

                context.restoreGState()
            } else {
                // Stacked bar chart - fallback to default rendering
                super.drawDataSet(context: context, dataSet: dataSet, index: index)
                return
            }
        }
    }
}
