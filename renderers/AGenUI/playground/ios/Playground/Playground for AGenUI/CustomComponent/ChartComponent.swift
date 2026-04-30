//
//  ChartComponent.swift
//  GenerativeUIClientSDK
//
//  Created by acoder-ai-infra on 2026/3/17.
//

import UIKit
import DGCharts
import FlexLayout
import AGenUI

/// Chart component implementation (complies with A2UI v0.9 protocol)
///
/// Supported chart types:
/// - line: Line chart
/// - donut: Donut chart
/// - pie: Pie chart
/// - bar: Bar chart (single and grouped bar charts)
///
/// Supported properties:
/// - chartType: Chart type (obtained from DataModel via path)
/// - data: Chart data (obtained from DataModel via path)
/// - styles.chartConfig.colors: Color array
///
/// @author acoder-ai-infra
/// @version 1.0 (2026-03-17)
class ChartComponent: Component {
    
    // MARK: - Properties
    
    private var chartView: ChartViewBase?
    private var currentChartType: ChartType = .line
    private var colors: [UIColor] = []
    private var chartData: [String: Any]?
    
    private var chartConfig: ChartStyleConfig = ChartStyleConfig()
    
    // MARK: - Chart Type Enum
    
    enum ChartType: String {
        case line = "line"
        case donut = "donut"
        case pie = "pie"
        case bar = "bar"
    }
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Chart", properties: properties)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - BaseA2UIComponent Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        super.updateProperties(properties)
        
        // Extract color configuration
        if let styles = properties["styles"] as? [String: Any],
           let chartConfigStyles = styles["chartConfig"] as? [String: Any],
           let colorsArray = chartConfigStyles["colors"] as? [String] {
            self.colors = colorsArray.compactMap { UIColor(hexString: $0) }
        }
        
        // If color array is empty, use default colors
        if colors.isEmpty {
            colors = [
                UIColor(hexString: "#FF6B6B")!,
                UIColor(hexString: "#4ECDC4")!,
                UIColor(hexString: "#45B7D1")!,
                UIColor(hexString: "#FFA07A")!
            ]
        }
        
        // Extract chart type (already parsed by C++)
        if let chartTypeValue = properties["chartType"] {
            let chartTypeString = CSSPropertyParser.extractStringValue(chartTypeValue)
            if let type = ChartType(rawValue: chartTypeString) {
                currentChartType = type
            }
        }
        
        // Extract chart data (already parsed by C++)
        // Note: Need to distinguish between path data binding reference ({"path": "..."}) and real chart data (containing "series" etc.)
        if let dataValue = properties["data"] as? [String: Any], dataValue["path"] == nil {
            self.chartData = dataValue
            renderChart()
        }
    }
    
    // MARK: - Chart Rendering
    
    private func renderChart() {
        guard let data = chartData else {
            return
        }
        
        // Remove all old chart subviews from container (prevent orphan view leaks)
        subviews.forEach { $0.removeFromSuperview() }
        chartView = nil
        
        // Create corresponding chart based on chart type
        switch currentChartType {
        case .line:
            renderLineChart(data: data, container: self)
        case .donut, .pie:
            renderPieChart(data: data, container: self, isDonut: currentChartType == .donut)
        case .bar:
            renderBarChart(data: data, container: self)
        }
        
        // Notify layout change
        notifyLayoutChanged()
    }
    
    // MARK: - Line Chart
    
    private func renderLineChart(data: [String: Any], container: UIView) {
        let lineChartView = LineChartView()
        setupChartView(lineChartView, in: container)
        
        guard let seriesArray = data["series"] as? [[String: Any]] else {
            print("[DEBUG] Invalid line chart data structure")
            return
        }
        
        // Extract X-axis labels
        let xAxisLabels = data["xAxis"] as? [String] ?? []
        
        // Extract Y-axis labels
        let yAxisLabels = data["yAxis"] as? [String] ?? []
        
        // Create data sets
        var dataSets: [LineChartDataSet] = []
        
        for (index, series) in seriesArray.enumerated() {
            guard let seriesData = series["data"] as? [[String: Any]] else { continue }
            
            var entries: [ChartDataEntry] = []
            for (xIndex, point) in seriesData.enumerated() {
                if let value = point["value"] as? Double {
                    entries.append(ChartDataEntry(x: Double(xIndex), y: value))
                } else if let value = point["value"] as? Int {
                    entries.append(ChartDataEntry(x: Double(xIndex), y: Double(value)))
                }
            }
            
            let dataSet = LineChartDataSet(entries: entries, label: series["name"] as? String ?? "")
            
            // Set colors (cycling)
            let color = colors[index % colors.count]
            dataSet.setColor(color)
            dataSet.setCircleColor(color)
            dataSet.lineWidth = 2.0
            dataSet.circleRadius = 4.0
            dataSet.drawValuesEnabled = true
            dataSet.valueFont = .systemFont(ofSize: 10)
            
            // Set data point labels
            dataSet.valueFormatter = LineChartValueFormatter(seriesData: seriesData)
            
            dataSets.append(dataSet)
        }
        
        let chartData = LineChartData(dataSets: dataSets)
        lineChartView.data = chartData
        
        // Configure X-axis
        configureXAxis(lineChartView.xAxis, labels: xAxisLabels)
        
        // Configure Y-axis
        configureYAxis(lineChartView.leftAxis, labels: yAxisLabels, data: dataSets, chartView: lineChartView)
        lineChartView.rightAxis.enabled = false
        
        // Configure legend
        configureLegend(lineChartView.legend)
        
        // Enable default interactions
        lineChartView.animate(xAxisDuration: 1.0)
        
        self.chartView = lineChartView
    }
    
    // MARK: - Pie Chart
    
    private func renderPieChart(data: [String: Any], container: UIView, isDonut: Bool) {
        let pieChartView = PieChartView()
        setupChartView(pieChartView, in: container)
        
        guard let seriesArray = data["series"] as? [[String: Any]],
              let firstSeries = seriesArray.first,
              let seriesData = firstSeries["data"] as? [[String: Any]] else {
            print("[DEBUG] Invalid pie chart data structure")
            return
        }
        
        // Create data entries
        var entries: [PieChartDataEntry] = []
        for point in seriesData {
            if let label = point["label"] as? String,
               let value = point["value"] as? Double {
                entries.append(PieChartDataEntry(value: value, label: label))
            } else if let label = point["label"] as? String,
                      let value = point["value"] as? Int {
                entries.append(PieChartDataEntry(value: Double(value), label: label))
            }
        }
        
        let dataSet = PieChartDataSet(entries: entries, label: "")
        
        // Set colors (cycling)
        var pieColors: [UIColor] = []
        for i in 0..<entries.count {
            pieColors.append(colors[i % colors.count])
        }
        dataSet.colors = pieColors
        
        // Configure leader lines
        dataSet.useValueColorForLine = true  // Leader lines use sector colors
        dataSet.valueLineWidth = 1.0
        dataSet.valueLinePart1OffsetPercentage = 0.8
        dataSet.valueLinePart1Length = 0.4  // First line segment length doubled (0.2 -> 0.4)
        dataSet.valueLinePart2Length = 0.8  // Second line segment length doubled (0.4 -> 0.8)
        
        // Display labels outside
        dataSet.xValuePosition = .outsideSlice
        dataSet.yValuePosition = .outsideSlice
        
        dataSet.valueFont = .systemFont(ofSize: 12)
        dataSet.valueTextColor = .darkGray
        
        // Calculate total for percentage display
        let total = entries.reduce(0.0) { $0 + $1.y }
        dataSet.valueFormatter = PieChartPercentFormatter(total: total)
        
        let chartData = PieChartData(dataSet: dataSet)
        pieChartView.data = chartData
        
        // Disable labels inside sectors
        pieChartView.drawEntryLabelsEnabled = false
        
        // Configure donut chart
        if isDonut {
            pieChartView.holeRadiusPercent = 0.5
            pieChartView.transparentCircleRadiusPercent = 0.55
        } else {
            pieChartView.holeRadiusPercent = 0
        }
        
        // Configure legend
        pieChartView.legend.enabled = true
        pieChartView.legend.horizontalAlignment = .right
        pieChartView.legend.verticalAlignment = .top
        pieChartView.legend.orientation = .horizontal
        pieChartView.legend.drawInside = false
        
        // Enable default interactions
        pieChartView.animate(xAxisDuration: 1.0, easingOption: .easeOutBack)
        
        self.chartView = pieChartView
    }
    
    // MARK: - Bar Chart
    
    private func renderBarChart(data: [String: Any], container: UIView) {
        let barChartView = BarChartView()
        setupChartView(barChartView, in: container)
        
        guard let seriesArray = data["series"] as? [[String: Any]] else {
            print("[DEBUG] Invalid bar chart data structure")
            return
        }
        
        // Extract X-axis labels
        let xAxisLabels = data["xAxis"] as? [String] ?? []
        
        // Extract Y-axis labels
        let yAxisLabels = data["yAxis"] as? [String] ?? []
        
        // Determine if single or grouped bar chart
        let isGrouped = seriesArray.count > 1
        
        // Apply gradient renderer
        applyGradientRenderer(to: barChartView)
        
        if isGrouped {
            renderGroupedBarChart(barChartView: barChartView, seriesArray: seriesArray, xAxisLabels: xAxisLabels, yAxisLabels: yAxisLabels)
        } else {
            renderSingleBarChart(barChartView: barChartView, seriesArray: seriesArray, xAxisLabels: xAxisLabels, yAxisLabels: yAxisLabels)
        }
        
        self.chartView = barChartView
    }
    
    private func applyGradientRenderer(to barChartView: BarChartView) {
        let gradientRenderer = GradientBarChartRenderer(
            dataProvider: barChartView,
            animator: barChartView.chartAnimator,
            viewPortHandler: barChartView.viewPortHandler,
            config: chartConfig
        )
        barChartView.renderer = gradientRenderer
    }
    
    private func renderSingleBarChart(barChartView: BarChartView, seriesArray: [[String: Any]], xAxisLabels: [String], yAxisLabels: [String]) {
        guard let firstSeries = seriesArray.first,
              let seriesData = firstSeries["data"] as? [[String: Any]] else {
            return
        }
        
        var entries: [BarChartDataEntry] = []
        for (xIndex, point) in seriesData.enumerated() {
            if let value = point["value"] as? Double {
                entries.append(BarChartDataEntry(x: Double(xIndex), y: value))
            } else if let value = point["value"] as? Int {
                entries.append(BarChartDataEntry(x: Double(xIndex), y: Double(value)))
            }
        }
        
        let dataSet = BarChartDataSet(entries: entries, label: firstSeries["name"] as? String ?? "")
        
        // Set different color for each bar (cycling colors array)
        var barColors: [UIColor] = []
        for i in 0..<entries.count {
            barColors.append(colors[i % colors.count])
        }
        dataSet.colors = barColors
        
        dataSet.valueFont = .systemFont(ofSize: 10)
        dataSet.valueFormatter = BarChartValueFormatter(seriesData: seriesData)
        
        // Enable text display above bars
        dataSet.drawValuesEnabled = true
        
        // Set text color (from configuration)
        dataSet.valueTextColor = chartConfig.valueLabelColor
        
        let chartData = BarChartData(dataSet: dataSet)
        
        // Note: Fixed value used here, actual bar width controlled by renderer
        chartData.barWidth = 0.3
        
        barChartView.data = chartData
        
        // Configure X-axis
        configureXAxis(barChartView.xAxis, labels: xAxisLabels)
        
        // Configure Y-axis
        configureYAxis(barChartView.leftAxis, labels: yAxisLabels, data: [dataSet], chartView: barChartView)
        barChartView.rightAxis.enabled = false
        
        // Single bar chart does not show legend (or shows single legend item)
        barChartView.legend.enabled = false
        
        barChartView.animate(yAxisDuration: 1.0)
    }
    
    private func renderGroupedBarChart(barChartView: BarChartView, seriesArray: [[String: Any]], xAxisLabels: [String], yAxisLabels: [String]) {
        var dataSets: [BarChartDataSet] = []
        
        for (index, series) in seriesArray.enumerated() {
            guard let seriesData = series["data"] as? [[String: Any]] else { continue }
            
            var entries: [BarChartDataEntry] = []
            for (xIndex, point) in seriesData.enumerated() {
                if let value = point["value"] as? Double {
                    entries.append(BarChartDataEntry(x: Double(xIndex), y: value))
                } else if let value = point["value"] as? Int {
                    entries.append(BarChartDataEntry(x: Double(xIndex), y: Double(value)))
                }
            }
            
            let dataSet = BarChartDataSet(entries: entries, label: series["name"] as? String ?? "")
            
            // Set colors (cycling)
            let color = colors[index % colors.count]
            dataSet.setColor(color)
            dataSet.valueFont = .systemFont(ofSize: 10)
            dataSet.valueFormatter = BarChartValueFormatter(seriesData: seriesData)
            
            // Enable text display above bars
            dataSet.drawValuesEnabled = true
            
            // Set text color (from configuration)
            dataSet.valueTextColor = chartConfig.valueLabelColor
            
            dataSets.append(dataSet)
        }
        
        let chartData = BarChartData(dataSets: dataSets)
        
        // Configure grouped bar chart
        let groupSpace = 0.3
        let barSpace = 0.05
        let barWidth = (1.0 - groupSpace) / Double(dataSets.count) - barSpace
        
        chartData.barWidth = barWidth
        barChartView.data = chartData
        
        // Group display
        if let data = barChartView.data, dataSets.count > 0, let firstDataSet = dataSets.first, !firstDataSet.entries.isEmpty {
            let groupCount = firstDataSet.entries.count
            
            chartData.groupBars(fromX: 0, groupSpace: groupSpace, barSpace: barSpace)
            
            // Adjust X-axis range to avoid left blank space and right clipping
            let adjustedMinimum = 0 - groupSpace / 2.0
            let groupWidth = Double(dataSets.count) * barWidth + Double(dataSets.count - 1) * barSpace
            let adjustedMaximum = Double(groupCount - 1) + groupWidth + groupSpace
            
            barChartView.xAxis.axisMinimum = adjustedMinimum
            barChartView.xAxis.axisMaximum = adjustedMaximum
        }
                
        // Configure X-axis
        configureXAxis(barChartView.xAxis, labels: xAxisLabels)
        
        // Configure Y-axis
        configureYAxis(barChartView.leftAxis, labels: yAxisLabels, data: dataSets, chartView: barChartView)
        barChartView.rightAxis.enabled = false
        
        // Configure legend
        configureLegend(barChartView.legend)
        
        barChartView.animate(yAxisDuration: 1.0)
    }
    
    // MARK: - Chart Configuration
    
    private func setupChartView(_ chartView: ChartViewBase, in container: UIView) {
        // Add chart view using FlexLayout
        container.flex.addItem(chartView).grow(1)
        
        // Basic configuration
        chartView.noDataText = "NO DATA"
        chartView.noDataFont = .systemFont(ofSize: 14)
        chartView.noDataTextColor = .gray
        
        // Disable all gesture interactions (drag, zoom, tap highlight) to avoid conflicts with outer ScrollView
        disableChartGestures(chartView)
    }
    
    /// Disable Chart drag and zoom gestures
    private func disableChartGestures(_ chartView: ChartViewBase) {
        if let barLineChart = chartView as? BarLineChartViewBase {
            // Disable drag
            barLineChart.dragXEnabled = false
            barLineChart.dragYEnabled = false
            // Disable zoom
            barLineChart.scaleXEnabled = false
            barLineChart.scaleYEnabled = false
            barLineChart.pinchZoomEnabled = false
        }
    }

    private func configureXAxis(_ xAxis: XAxis, labels: [String]) {
        xAxis.labelPosition = .bottom
        xAxis.drawGridLinesEnabled = false
        xAxis.granularity = 1.0
        // Set axis line color
        xAxis.axisLineColor = chartConfig.axisLineColor
        
        // If all labels are empty, do not display X-axis
        let hasNonEmptyLabel = labels.contains { !$0.isEmpty }
        if hasNonEmptyLabel {
            xAxis.valueFormatter = IndexAxisValueFormatter(values: labels)
            xAxis.labelFont = .systemFont(ofSize: 10)
            xAxis.labelTextColor = .darkGray
        } else {
            xAxis.drawLabelsEnabled = false
        }
    }
    
    private func configureYAxis(_ yAxis: YAxis, labels: [String], data: [ChartDataSetProtocol], chartView: ChartViewBase) {
        yAxis.drawGridLinesEnabled = true
        // Grid line color (from configuration)
        yAxis.gridColor = chartConfig.gridLineColor
        yAxis.gridLineWidth = 0.5
        // Enable dashed grid (from configuration)
        yAxis.gridLineDashLengths = chartConfig.gridLineDashPattern
        
        // Set axis line color
        yAxis.axisLineColor = chartConfig.axisLineColor
        
        // Calculate max and min values from data
        var maxValue: Double = 0
        var minValue: Double = 0
        
        for dataSet in data {
            if let barDataSet = dataSet as? BarChartDataSet {
                for entry in barDataSet.entries {
                    maxValue = max(maxValue, entry.y)
                    minValue = min(minValue, entry.y)
                }
            } else if let lineDataSet = dataSet as? LineChartDataSet {
                for entry in lineDataSet.entries {
                    maxValue = max(maxValue, entry.y)
                    minValue = min(minValue, entry.y)
                }
            }
        }
        
        // Configure Y-axis labels
        if !labels.isEmpty {
            yAxis.labelCount = labels.count
            yAxis.valueFormatter = YAxisValueFormatter(labels: labels)
            yAxis.labelFont = .systemFont(ofSize: 10)
            yAxis.labelTextColor = .darkGray
        }
        
        // Y-axis range determined entirely by data value max/min, labels are display text only
        yAxis.axisMinimum = 0
        if maxValue > 0 {
            // Leave 30% top space for text above bars (up to two lines)
            yAxis.axisMaximum = maxValue * 1.3
        } else {
            yAxis.axisMaximum = 1.0
        }
        
        // Configure Y-axis labels (evenly distributed on Y-axis, no mapping to values)
        // 3 labels = 4 lines: bottom line (coincides with X-axis, no label) + 3 labeled lines
        if !labels.isEmpty {
            yAxis.labelCount = labels.count + 1 // +1 is the bottom blank line
            yAxis.forceLabelsEnabled = true // Force evenly distributed specified number of labels
            yAxis.valueFormatter = YAxisValueFormatter(labels: labels)
            yAxis.labelFont = .systemFont(ofSize: 10)
            yAxis.labelTextColor = .darkGray
        }
    }
    
    private func configureLegend(_ legend: Legend) {
        legend.enabled = true
        legend.horizontalAlignment = .right
        legend.verticalAlignment = .top
        legend.orientation = .horizontal
        legend.drawInside = false
        legend.font = .systemFont(ofSize: 12)
        legend.textColor = .darkGray
    }
}

// MARK: - Value Formatters

class LineChartValueFormatter: ValueFormatter {
    private let seriesData: [[String: Any]]
    
    init(seriesData: [[String: Any]]) {
        self.seriesData = seriesData
    }
    
    func stringForValue(_ value: Double, entry: ChartDataEntry, dataSetIndex: Int, viewPortHandler: ViewPortHandler?) -> String {
        let index = Int(entry.x)
        guard index >= 0 && index < seriesData.count else { return "" }
        
        let point = seriesData[index]
        if let label = point["label"] as? String, !label.isEmpty {
            return label
        }
        return ""
    }
}

class BarChartValueFormatter: ValueFormatter {
    private let seriesData: [[String: Any]]
    
    init(seriesData: [[String: Any]]) {
        self.seriesData = seriesData
    }
    
    func stringForValue(_ value: Double, entry: ChartDataEntry, dataSetIndex: Int, viewPortHandler: ViewPortHandler?) -> String {
        let index = Int(entry.x)
        guard index >= 0 && index < seriesData.count else { return "" }
        
        let point = seriesData[index]
        if let label = point["label"] as? String, !label.isEmpty {
            // Step 1: If over 10 chars, replace with...
            var processedLabel = label
            if label.count > 10 {
                let endIndex = label.index(label.startIndex, offsetBy: 10)
                processedLabel = String(label[..<endIndex]) + "..."
            }
            
            // Step 2: If over 5 chars, wrap lines (5 chars per line)
            if processedLabel.count > 5 {
                var result = ""
                var currentIndex = processedLabel.startIndex
                var lineCount = 0
                while currentIndex < processedLabel.endIndex {
                    if lineCount > 0 {
                        result += "\n"
                    }
                    let endIndex = processedLabel.index(currentIndex, offsetBy: min(5, processedLabel.distance(from: currentIndex, to: processedLabel.endIndex)))
                    result += String(processedLabel[currentIndex..<endIndex])
                    currentIndex = endIndex
                    lineCount += 1
                }
                return result
            }
            return processedLabel
        }
        return ""
    }
}

class YAxisValueFormatter: AxisValueFormatter {
    private let labels: [String]
    
    init(labels: [String]) {
        self.labels = labels
    }
    
    func stringForValue(_ value: Double, axis: AxisBase?) -> String {
        guard !labels.isEmpty, let yAxis = axis as? YAxis else { return "" }
        
        let range = yAxis.axisMaximum - yAxis.axisMinimum
        guard range > 0 else { return "" }
        
        // Total lines = labels.count + 1 (bottom blank line + N labeled lines)
        let totalLines = labels.count + 1
        let ratio = (value - yAxis.axisMinimum) / range
        let lineIndex = Int(round(ratio * Double(totalLines - 1)))
        
        // lineIndex=0 is bottom line (coincides with X-axis), no content displayed
        // lineIndex=1,2,3... corresponds to labels[0], labels[1], labels[2]...
        if lineIndex > 0 && lineIndex <= labels.count {
            return labels[lineIndex - 1]
        }
        
        return ""
    }
}

class PieChartPercentFormatter: ValueFormatter {
    private let total: Double
    
    init(total: Double) {
        self.total = total
    }
    
    func stringForValue(_ value: Double, entry: ChartDataEntry, dataSetIndex: Int, viewPortHandler: ViewPortHandler?) -> String {
        guard total > 0 else { return "" }
        
        // Calculate percentage
        let percentage = (value / total) * 100.0
        
        return String(format: "%.1f%%", percentage)
    }
}

// MARK: - Chart Gesture Delegate

/// Chart gesture delegate, resolves sliding conflicts with outer vertical ScrollView
/// - Keep pinch zoom and tap highlight
/// - Fail gesture on vertical swipe, pass through to outer List/ScrollView
class ChartGestureDelegate: NSObject, NSUIGestureRecognizerDelegate {
    static let shared = ChartGestureDelegate()
    
    func gestureRecognizerShouldBegin(_ gestureRecognizer: NSUIGestureRecognizer) -> Bool {
        guard let panGesture = gestureRecognizer as? NSUIPanGestureRecognizer else {
            return true // Non-pan gestures (e.g., pinch/tap) directly allowed
        }
        
        // Get swipe direction
        let velocity = panGesture.velocity(in: panGesture.view)
        let isVertical = abs(velocity.y) > abs(velocity.x)
        
        if isVertical {
            // Vertical swipe: fail pan gesture, pass through to outer ScrollView
            return false
        }
        
        // Horizontal swipe: allow Chart pan gesture (for dragging to view data)
        return true
    }
}

// MARK: - Chart Style Config

/// Chart style config struct (hardcoded default values)
struct ChartStyleConfig {
    // Bar bottom corner radius 4px -> 2pt (top radius = half bar width)
    var barCornerRadiusBottom: CGFloat = 2.0
    // Bar gradient top color (from colors array)
    var barGradientTopColor: UIColor = .red
    // Bar gradient bottom color
    var barGradientBottomColor: UIColor = .white
    // Value label color #00000099
    var valueLabelColor: UIColor = UIColor(hexString: "#00000099") ?? .darkGray
    // Value label offset 12px -> 6pt
    var valueLabelOffset: CGFloat = 6.0
    // Grid line color
    var gridLineColor: UIColor = UIColor(hexString: "#E5E5E5") ?? .lightGray
    // Grid line dash mode
    var gridLineDashPattern: [CGFloat] = [4.0, 4.0]
    // Axis line color #0000000F (Color_Gray_06)
    var axisLineColor: UIColor = UIColor(hexString: "#0000000F") ?? .clear
    // Value to chart gap 16px -> 8pt
    var valueChartGap: CGFloat = 8.0
}
