//
//  A2UIPlaygroundEditViewController.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit

class A2UIPlaygroundEditViewController: UIViewController {
    
    // MARK: - Properties
    
    private let titleLabel = UILabel()
    private let closeButton = UIButton(type: .system)
    private let separatorView = UIView()
    
    private let segmentedControl = UISegmentedControl(items: ["Components", "DataModel"])
    private let textView = UITextView()
    
    private let previewButton = UIButton(type: .system)
    
    /// Store edit content
    private var componentsText: String = ""
    private var dataModelText: String = ""
    
    /// Current selected Tab (0: Components, 1: DataModel)
    private var currentTab: Int = 0
    
    /// Initial data
    var initialComponentsJSON: String?
    var initialDataModelJSON: String?
    
    /// Data submission callback closure
    var onDataSubmitted: ((String?, String?) -> Void)?
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupKeyboardDismiss()
        loadInitialData()
        updateTitle()
    }
    
    // MARK: - Private Methods
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Set close button
        closeButton.setImage(UIImage(systemName: "xmark"), for: .normal)
        closeButton.addTarget(self, action: #selector(closeButtonTapped), for: .touchUpInside)
        view.addSubview(closeButton)
        
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            closeButton.widthAnchor.constraint(equalToConstant: 44),
            closeButton.heightAnchor.constraint(equalToConstant: 44)
        ])
        
        // Set title
        titleLabel.text = "Edit"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textAlignment = .left
        view.addSubview(titleLabel)
        
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            titleLabel.centerYAnchor.constraint(equalTo: closeButton.centerYAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            titleLabel.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -16)
        ])
        
        // Set separator
        separatorView.backgroundColor = .separator
        view.addSubview(separatorView)
        
        separatorView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            separatorView.topAnchor.constraint(equalTo: closeButton.bottomAnchor, constant: 16),
            separatorView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            separatorView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            separatorView.heightAnchor.constraint(equalToConstant: 1)
        ])
        
        // Set SegmentedControl
        segmentedControl.selectedSegmentIndex = 0
        segmentedControl.addTarget(self, action: #selector(segmentChanged), for: .valueChanged)
        view.addSubview(segmentedControl)
        
        segmentedControl.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            segmentedControl.topAnchor.constraint(equalTo: separatorView.bottomAnchor, constant: 16),
            segmentedControl.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            segmentedControl.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            segmentedControl.heightAnchor.constraint(equalToConstant: 32)
        ])
        
        // Set TextView
        textView.font = .monospacedSystemFont(ofSize: 14, weight: .regular)
        textView.layer.borderColor = UIColor.separator.cgColor
        textView.layer.borderWidth = 1
        textView.layer.cornerRadius = 8
        textView.textContainerInset = UIEdgeInsets(top: 8, left: 8, bottom: 8, right: 8)
        textView.autocapitalizationType = .none
        textView.autocorrectionType = .no
        textView.smartDashesType = .no
        textView.smartQuotesType = .no
        view.addSubview(textView)
        
        textView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            textView.topAnchor.constraint(equalTo: segmentedControl.bottomAnchor, constant: 16),
            textView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            textView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            textView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -80)
        ])
        
        // Set preview button
        previewButton.setTitle("Preview", for: .normal)
        previewButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
        previewButton.backgroundColor = .systemGreen
        previewButton.setTitleColor(.white, for: .normal)
        previewButton.layer.cornerRadius = 8
        previewButton.addTarget(self, action: #selector(previewButtonTapped), for: .touchUpInside)
        view.addSubview(previewButton)
        
        previewButton.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            previewButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            previewButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            previewButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            previewButton.heightAnchor.constraint(equalToConstant: 44)
        ])
    }
    
    /// Set tap blank area to dismiss keyboard
    private func setupKeyboardDismiss() {
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
        tapGesture.cancelsTouchesInView = false
        view.addGestureRecognizer(tapGesture)
    }
    
    /// Load initial data
    private func loadInitialData() {
        // Load Components data
        if let componentsJSON = initialComponentsJSON {
            componentsText = formatJSON(componentsJSON)
        }
        
        // Load DataModel data
        if let dataModelJSON = initialDataModelJSON {
            dataModelText = formatJSON(dataModelJSON)
        }
        
        // Load current Tab content
        loadContentForCurrentTab()
    }
    
    /// Update title
    private func updateTitle() {
        // Determine title based on whether there is initial data
        let hasInitialData = (initialComponentsJSON != nil && !initialComponentsJSON!.isEmpty) ||
                            (initialDataModelJSON != nil && !initialDataModelJSON!.isEmpty)
        
        // If there is initial data, show "Edit", otherwise show "Custom Input"
        titleLabel.text = hasInitialData ? "Edit" : "Custom Input"
    }
    
    /// Save current edit content
    private func saveCurrentContent() {
        let content = textView.text ?? ""
        if currentTab == 0 {
            componentsText = content
        } else {
            dataModelText = content
        }
    }
    
    /// Load current Tab content
    private func loadContentForCurrentTab() {
        if currentTab == 0 {
            textView.text = componentsText
        } else {
            textView.text = dataModelText
        }
    }
    
    /// Format JSON (make JSON more readable)
    private func formatJSON(_ jsonString: String) -> String {
        guard let data = jsonString.data(using: .utf8),
              let jsonObject = try? JSONSerialization.jsonObject(with: data),
              let formattedData = try? JSONSerialization.data(withJSONObject: jsonObject, options: [.prettyPrinted, .sortedKeys]),
              let formattedString = String(data: formattedData, encoding: .utf8) else {
            return jsonString
        }
        return formattedString
    }
    
    // MARK: - Actions
    
    @objc private func closeButtonTapped() {
        dismiss(animated: true)
    }
    
    @objc private func dismissKeyboard() {
        view.endEditing(true)
    }
    
    @objc private func segmentChanged(_ sender: UISegmentedControl) {
        // Save current content
        saveCurrentContent()
        
        // Update current Tab
        currentTab = sender.selectedSegmentIndex
        
        // Load new Tab content
        loadContentForCurrentTab()
    }
    
    @objc private func previewButtonTapped() {
        // Dismiss keyboard
        view.endEditing(true)
        
        // Save current edit content
        saveCurrentContent()
        
        // Get text from both Tabs
        let components = componentsText.trimmingCharacters(in: .whitespacesAndNewlines)
        let dataModel = dataModelText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Validate input
        guard !components.isEmpty || !dataModel.isEmpty else {
            showAlert(title: "Notice", message: "Please enter at least one JSON data")
            return
        }
        
        var errorMessages: [String] = []
        
        // Validate Components JSON format
        if !components.isEmpty {
            if let componentsData = components.data(using: .utf8),
               (try? JSONSerialization.jsonObject(with: componentsData)) == nil {
                errorMessages.append("Components JSON format error")
            }
        }
        
        // Validate DataModel JSON format
        if !dataModel.isEmpty {
            if let dataModelData = dataModel.data(using: .utf8),
               (try? JSONSerialization.jsonObject(with: dataModelData)) == nil {
                errorMessages.append("DataModel JSON format error")
            }
        }
        
        // If there are format errors, show error message
        if !errorMessages.isEmpty {
            showAlert(
                title: "Format Error",
                message: errorMessages.joined(separator: "\n")
            )
            return
        }
        
        // Pass data back through closure (sent uniformly by main page)
        onDataSubmitted?(
            components.isEmpty ? nil : components,
            dataModel.isEmpty ? nil : dataModel
        )
        
        // Close page directly
        dismiss(animated: true)
    }
    
    // MARK: - Helper Methods
    
    /// Show alert dialog
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
