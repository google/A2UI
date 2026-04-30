//
//  A2UIPlaygroundMenuViewController.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit

class A2UIPlaygroundMenuViewController: UIViewController {
    
    // MARK: - Properties
    
    private let titleLabel = UILabel()
    private let closeButton = UIButton(type: .system)
    private let addButton = UIButton(type: .system)
    private let backButton = UIButton(type: .system)
    private let separatorView = UIView()
    private let tableView = UITableView()
    
    // Component type list (first level menu)
    private var componentTypes: [String] = []
    // Current selected component type and its variant list (second level menu)
    private var currentComponentType: String?
    private var currentVariants: [String] = []
    
    // Templates directory path in Bundle
    private var templatesDir: String = ""
    
    /// Data selection callback closure
    var onDataSelected: ((String?, String?) -> Void)?

    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        
//        DispatchQueue.global(qos: .background).async {
            if self.componentTypes.isEmpty {
                self.loadTemplatesFromBundle()
            }

            // Refresh table view
            DispatchQueue.main.async { [weak self] in
                self?.tableView.reloadData()
            }
//        }
    }
    
    // MARK: - Private Methods
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Set back button (initially hidden)
        backButton.setImage(UIImage(systemName: "chevron.left"), for: .normal)
        backButton.addTarget(self, action: #selector(backButtonTapped), for: .touchUpInside)
        backButton.isHidden = true
        view.addSubview(backButton)
        
        backButton.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            backButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            backButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            backButton.widthAnchor.constraint(equalToConstant: 44),
            backButton.heightAnchor.constraint(equalToConstant: 44)
        ])
        
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
        
        // Set add button
        addButton.setImage(UIImage(systemName: "plus.circle"), for: .normal)
        addButton.addTarget(self, action: #selector(addButtonTapped), for: .touchUpInside)
        view.addSubview(addButton)
        
        addButton.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            addButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            addButton.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8),
            addButton.widthAnchor.constraint(equalToConstant: 44),
            addButton.heightAnchor.constraint(equalToConstant: 44)
        ])
        
        // Set title
        titleLabel.text = "Select Component"
        titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
        titleLabel.textAlignment = .center
        view.addSubview(titleLabel)
        
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            titleLabel.centerYAnchor.constraint(equalTo: closeButton.centerYAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: backButton.trailingAnchor, constant: 8),
            titleLabel.trailingAnchor.constraint(equalTo: closeButton.leadingAnchor, constant: -8)
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
        
        // Set table view
        tableView.delegate = self
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "MenuCell")
        tableView.separatorStyle = .singleLine
        tableView.backgroundColor = .clear
        view.addSubview(tableView)
        
        tableView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: separatorView.bottomAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    private func loadTemplatesFromBundle() {
        // Get Templates folder path from Bundle
        guard let templatesPath = Bundle.main.path(forResource: "Templates", ofType: nil) else {
            print("⚠️ Templates folder not found in Bundle")
            return
        }
        
        // Use Templates as root directory (will show A2UI Show as first level)
        templatesDir = templatesPath + "/"
        let fileManager = FileManager.default
        
        // Verify Templates folder exists
        guard fileManager.fileExists(atPath: templatesDir) else {
            print("⚠️ Templates folder not found at: \(templatesDir)")
            return
        }
        
        // Traverse directory to get all top-level folders (e.g., A2UI Show)
        guard let contents = try? fileManager.contentsOfDirectory(atPath: templatesDir) else {
            print("⚠️ Unable to read templates directory contents")
            return
        }
        
        // Filter valid folders (exclude system files)
        componentTypes = contents.filter { item in
            // Filter hidden files and system folders
            guard !item.hasPrefix(".") && item != "__MACOSX" else {
                return false
            }
            
            var isDirectory: ObjCBool = false
            let fullPath = templatesDir + item
            fileManager.fileExists(atPath: fullPath, isDirectory: &isDirectory)
            return isDirectory.boolValue
        }.sorted()
        
        print("✅ Loaded \(componentTypes.count) top-level folders from Bundle")
    }
    
    private func loadVariants(for componentType: String) {
        let fileManager = FileManager.default
        let componentPath = templatesDir + componentType
        
        guard let contents = try? fileManager.contentsOfDirectory(atPath: componentPath) else {
            print("⚠️ Unable to read component directory: \(componentType)")
            return
        }
        
        // Filter valid variant folders
        currentVariants = contents.filter { item in
            // Filter hidden files and system files
            guard !item.hasPrefix(".") && item != "__MACOSX" else {
                return false
            }
            
            var isDirectory: ObjCBool = false
            let fullPath = componentPath + "/" + item
            fileManager.fileExists(atPath: fullPath, isDirectory: &isDirectory)
            return isDirectory.boolValue
        }.sorted()
        
        print("✅ Component \(componentType) has \(currentVariants.count) variants")
    }
    
    private func showVariants(for componentType: String) {
        currentComponentType = componentType
        loadVariants(for: componentType)
        
        // Update UI
        titleLabel.text = componentType
        backButton.isHidden = false
        
        // Refresh table
        tableView.reloadData()
    }
    
    private func backToComponentList() {
        currentComponentType = nil
        currentVariants = []
        
        // Update UI
        titleLabel.text = "Select Component"
        backButton.isHidden = true
        
        // Refresh table
        tableView.reloadData()
    }
    
    private func loadTemplateFiles(componentType: String, variant: String) {
        let fileManager = FileManager.default
        let variantPath = templatesDir + componentType + "/" + variant
        
        // Define files to process
        let targetFiles = ["updateComponents.json", "updateDataModel.json"]
        
        var componentsJSON: String?
        var dataModelJSON: String?
        
        // Process specified files in order
        for fileName in targetFiles {
            let filePath = variantPath + "/" + fileName
            
            // Check if file exists
            guard fileManager.fileExists(atPath: filePath) else {
                print("⚠️ File does not exist: \(filePath)")
                continue
            }
            
            // Read file content
            guard let jsonString = try? String(contentsOfFile: filePath, encoding: .utf8) else {
                print("⚠️ Unable to read file: \(fileName)")
                continue
            }
            
            // Save JSON data for callback
            if fileName == "updateComponents.json" {
                componentsJSON = jsonString
            } else if fileName == "updateDataModel.json" {
                dataModelJSON = jsonString
            }
            
            print("✅ Read: \(componentType)/\(variant)/\(fileName)")
        }
        
        // Pass data back through closure (sent uniformly by main page)
        onDataSelected?(componentsJSON, dataModelJSON)
        
        // Close page directly
        dismiss(animated: true)
    }
    
    // MARK: - Actions
    
    @objc private func closeButtonTapped() {
        dismiss(animated: true)
    }
    
    @objc private func backButtonTapped() {
        backToComponentList()
    }
    
    @objc private func addButtonTapped() {
        // Prepare default template data
        let defaultComponents = """
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "modal_demo",
    "components": [
      {
        "id": "root",
        "component": "Modal",
        "trigger": "modal-title",
        "content": "modal-content",
        "visible": true
      },
      {
        "id": "modal-title",
        "component": "Text",
        "text": "Click Modal",
        "variant": "body"
      },
      {
        "id": "modal-content",
        "component": "Text",
        "text": "This is the modal content",
        "variant": "body"
      }
    ]
  }
}
"""
        
        let defaultDataModel = """
"""
        
        // Create Edit page
        let editVC = A2UIPlaygroundEditViewController()
        editVC.modalPresentationStyle = .fullScreen
        editVC.initialComponentsJSON = defaultComponents
        editVC.initialDataModelJSON = defaultDataModel
        
        // Key modification: Capture Playground's callback before Menu dismiss
        // This way even if Menu is released, Edit can still callback to Playground through this closure
        let dataSelectedCallback = self.onDataSelected
        editVC.onDataSubmitted = { componentsJSON, dataModelJSON in
            dataSelectedCallback?(componentsJSON, dataModelJSON)
        }
        
        // Close current Menu page first, then open Edit page
        let presentingVC = self.presentingViewController
        dismiss(animated: true) {
            presentingVC?.present(editVC, animated: true)
        }
    }
}

// MARK: - UITableViewDataSource

extension A2UIPlaygroundMenuViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if currentComponentType != nil {
            // Second level menu: show variant list
            return currentVariants.count
        } else {
            // First level menu: show component type list
            return componentTypes.count
        }
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "MenuCell", for: indexPath)
        
        if currentComponentType != nil {
            // Second level menu: show variant name
            cell.textLabel?.text = currentVariants[indexPath.row]
            cell.accessoryType = .none
        } else {
            // First level menu: show component type name
            cell.textLabel?.text = componentTypes[indexPath.row]
            cell.accessoryType = .disclosureIndicator
        }
        
        cell.backgroundColor = .clear
        return cell
    }
}

// MARK: - UITableViewDelegate

extension A2UIPlaygroundMenuViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        
        if let componentType = currentComponentType {
            // Second level menu: selected specific variant
            let variant = currentVariants[indexPath.row]
            loadTemplateFiles(componentType: componentType, variant: variant)
        } else {
            // First level menu: selected component type, enter second level menu
            let componentType = componentTypes[indexPath.row]
            showVariants(for: componentType)
        }
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 56
    }
}
