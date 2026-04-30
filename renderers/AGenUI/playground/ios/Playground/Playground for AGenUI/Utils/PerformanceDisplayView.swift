//
//  PerformanceDisplayView.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/3/22.
//

import UIKit

/// Performance display view
class PerformanceDisplayView: UIView {
    
    // MARK: - UI Components
    
    private let containerStackView: UIStackView = {
        let stack = UIStackView()
        stack.axis = .horizontal
        stack.spacing = 8
        stack.alignment = .center
        stack.distribution = .equalSpacing
        stack.translatesAutoresizingMaskIntoConstraints = false
        return stack
    }()
    
    private let fpsView = MetricView(icon: "FPS", color: .systemGreen)
    private let cpuView = MetricView(icon: "CPU", color: .systemOrange)
    private let memoryView = MetricView(icon: "MEM", color: .systemBlue)
    
    // MARK: - Initialization
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupUI()
    }
    
    // MARK: - Setup
    
    private func setupUI() {
        backgroundColor = .clear
        
        // Add subviews
        addSubview(containerStackView)
        
        containerStackView.addArrangedSubview(fpsView)
        containerStackView.addArrangedSubview(cpuView)
        containerStackView.addArrangedSubview(memoryView)
        
        // Setup constraints
        NSLayoutConstraint.activate([
            containerStackView.topAnchor.constraint(equalTo: topAnchor),
            containerStackView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerStackView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerStackView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }
    
    // MARK: - Public Methods
    
    /// Update performance data
    func updatePerformance(fps: Int, cpu: Double, memory: Double) {
        fpsView.updateValue("\(fps)")
        cpuView.updateValue(String(format: "%.0f%%", cpu))
        memoryView.updateValue(String(format: "%.0fM", memory))
    }
}

// MARK: - MetricView

private class MetricView: UIView {
    
    private let iconLabel: UILabel = {
        let label = UILabel()
        label.font = .systemFont(ofSize: 14)
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let valueLabel: UILabel = {
        let label = UILabel()
        label.font = .monospacedSystemFont(ofSize: 11, weight: .medium)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        return label
    }()
    
    private let containerView: UIView = {
        let view = UIView()
        view.layer.cornerRadius = 8
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()
    
    private let color: UIColor
    
    init(icon: String, color: UIColor) {
        self.color = color
        super.init(frame: .zero)
        
        iconLabel.text = icon
        valueLabel.textColor = color
        containerView.backgroundColor = color.withAlphaComponent(0.1)
        
        setupUI()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupUI() {
        addSubview(containerView)
        containerView.addSubview(iconLabel)
        containerView.addSubview(valueLabel)
        
        translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: topAnchor),
            containerView.leadingAnchor.constraint(equalTo: leadingAnchor),
            containerView.trailingAnchor.constraint(equalTo: trailingAnchor),
            containerView.bottomAnchor.constraint(equalTo: bottomAnchor),
            
            iconLabel.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 4),
            iconLabel.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            
            valueLabel.topAnchor.constraint(equalTo: iconLabel.bottomAnchor, constant: 2),
            valueLabel.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 6),
            valueLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -6),
            valueLabel.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -4),
            
            containerView.widthAnchor.constraint(greaterThanOrEqualToConstant: 50)
        ])
    }
    
    func updateValue(_ value: String) {
        valueLabel.text = value
    }
}
