//
//  A2UIPlaygroundViewController.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit
import AGenUI
import AVFoundation

class A2UIPlaygroundViewController: UIViewController, SurfaceManagerListener, AVCaptureMetadataOutputObjectsDelegate {
    
    // MARK: - Properties
    
    /// Surface Manager instance
    private let surfaceManager = SurfaceManager()
    
    /// Theme Manager instance
    private let themeManager = ThemeManager()
    
    /// Performance display view
    private let performanceDisplayView = PerformanceDisplayView()
    
    /// Scroll view
    private let scrollView = UIScrollView()
    private let surfaceId: String? = nil

    /// Store current JSON data
    private var currentComponentsJSON: String?
    private var currentDataModelJSON: String?
    
    /// Store previous surfaceId for deletion
    private var previousSurfaceId: String?
    
    /// Edit button reference
    private var editBarButtonItem: UIBarButtonItem!
    
    /// Registered functions (strong references to prevent deallocation)
    private let toastFunction = ToastFunction()

    // MARK: - QR Code Scanner properties
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var qrCodeFrameView: UIView?
    private var windowQRCodeFrameView: UIView?
    

    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupUI()
        setupNavigationBar()
        setupPerformanceMonitor()

        // Register as Surface lifecycle listener
        surfaceManager.addListener(self)
        
        // Assign surfaceManager to ThemeManager to ensure the same instance is used
        themeManager.surfaceManager = surfaceManager
        
        registerDecoupledComponents()
    }
    
    /// Register components that have been decoupled from the SDK.
    /// These components (Lottie, Chart, Markdown) are no longer auto-registered by the SDK
    /// and must be registered by the host application.
    private func registerDecoupledComponents() {
        // Lottie component
        AGenUISDK.registerComponent("Lottie") { id, properties in
            return LottieComponent(componentId: id, properties: properties)
        }
        
        // Chart component
        AGenUISDK.registerComponent("Chart") { id, properties in
            return ChartComponent(componentId: id, properties: properties)
        }
        
        // Markdown component
        AGenUISDK.registerComponent("Markdown") { id, properties in
            return MarkdownComponent(componentId: id, properties: properties)
        }
        
        // Toast function
        AGenUISDK.registerFunction(toastFunction)
    }
    
    private func setupUI() {
        view.backgroundColor = .systemBackground
        
        // Add ScrollView
        view.addSubview(scrollView)
        scrollView.backgroundColor = .systemGray6
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        
        // ScrollView constraints - fixed to view's four edges
        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    private func setupNavigationBar() {
        // Set title
        title = "A2UI Playground"
        
        // Create left menu button
        let menuButton = UIBarButtonItem(
            image: UIImage(systemName: "line.3.horizontal"),
            style: .plain,
            target: self,
            action: #selector(menuButtonTapped)
        )
        navigationItem.leftBarButtonItem = menuButton
        
        // Create right button group
        let editButton = UIBarButtonItem(
            image: UIImage(systemName: "square.and.pencil"),
            style: .plain,
            target: self,
            action: #selector(editButtonTapped)
        )
        editButton.isEnabled = false  // Initially disabled
        editBarButtonItem = editButton  // Save reference

        // Create theme button with menu
        let themeButton = createThemeButtonWithMenu()

        navigationItem.rightBarButtonItems = [themeButton, editButton]
        
        // Configure navigation bar appearance
        navigationController?.navigationBar.prefersLargeTitles = true
        
        // Add performance display view to navigation bar
        setupPerformanceDisplayInNavigationBar()
    }
    
    private func setupPerformanceDisplayInNavigationBar() {
        // Create a container view for the performance display
        let containerView = UIView()
        containerView.translatesAutoresizingMaskIntoConstraints = false
        
        // Add performance display view
        containerView.addSubview(performanceDisplayView)
        performanceDisplayView.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            performanceDisplayView.topAnchor.constraint(equalTo: containerView.topAnchor),
            performanceDisplayView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            performanceDisplayView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            performanceDisplayView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),
            performanceDisplayView.heightAnchor.constraint(equalToConstant: 44)
        ])
        
        // Set as title view
        navigationItem.titleView = containerView
    }
    
    private func setupPerformanceMonitor() {
        // Start monitoring
        PerformanceMonitor.shared.startMonitoring()
        
        // Set update callback
        PerformanceMonitor.shared.onPerformanceUpdate = { [weak self] fps, cpu, memory in
            self?.performanceDisplayView.updatePerformance(fps: fps, cpu: cpu, memory: memory)
        }
    }
    
    // MARK: - SurfaceManagerListener
    
    /// Surface creation completed callback
    ///
    /// - Parameter surface: Surface object
    func onCreateSurface(_ surface: Surface) {

        scrollView.subviews.forEach { $0.removeFromSuperview() }

        print("[Playground] 🎨 Surface created: \(surface.surfaceId)")
        
        surface.updateSize(width: self.view.bounds.width, height: .infinity)
        scrollView.addSubview(surface.view)
        
        surface.onLayoutChanged = { [weak self] in
            guard let self = self else {
                print("[Playground] ⚠️ Layout changed but self is nil for: \(surface.surfaceId)")
                return
            }
            
            // Use surface.view height (view size is determined by Surface's width/height)
            let height = surface.view.frame.size.height
            self.scrollView.contentSize = CGSize(width: scrollView.frame.size.width, height: height)
        }
        
        print("[Playground] ✅ Surface rootView added to container: \(surface.surfaceId)")
    }
    
    /// Surface deletion completed callback
    ///
    /// - Parameter surface: Surface
    func onDeleteSurface(_ surface: Surface) {
        print("[Playground] Surface deleted: \(surface.surfaceId)")

        // Remove all subviews from scrollView
        scrollView.subviews.forEach { $0.removeFromSuperview() }
    }
    
    // MARK: - Actions
    
    @objc private func menuButtonTapped() {
        let menuVC = A2UIPlaygroundMenuViewController()
        menuVC.modalPresentationStyle = .fullScreen
        
        // Set data callback closure
        menuVC.onDataSelected = { [weak self] componentsJSON, dataModelJSON in
            self?.currentComponentsJSON = componentsJSON
            self?.currentDataModelJSON = dataModelJSON
            // Send data uniformly
            self?.sendJSONData(componentsJSON: componentsJSON, dataModelJSON: dataModelJSON)
            // Enable edit button
            self?.editBarButtonItem.isEnabled = true
        }
        
        present(menuVC, animated: true)
    }
    
    @objc private func themeButtonTapped() {
        themeManager.showThemeSelector(from: self)
    }
    
    @objc private func editButtonTapped() {
        let editVC = A2UIPlaygroundEditViewController()
        editVC.initialComponentsJSON = currentComponentsJSON
        editVC.initialDataModelJSON = currentDataModelJSON

        // Set data submission callback
        editVC.onDataSubmitted = { [weak self] componentsJSON, dataModelJSON in
            self?.currentComponentsJSON = componentsJSON
            self?.currentDataModelJSON = dataModelJSON
            // Send data uniformly
            self?.sendJSONData(componentsJSON: componentsJSON, dataModelJSON: dataModelJSON)
        }

        editVC.modalPresentationStyle = .fullScreen
        present(editVC, animated: true)
    }

    // MARK: - Menu and Actions

    private func createThemeButtonWithMenu() -> UIBarButtonItem {
        if #available(iOS 14.0, *) {
            let themeAction = UIAction(title: "Theme Selection", image: UIImage(systemName: "paintbrush.fill")) { [weak self] _ in
                self?.themeButtonTapped()
            }

            let scanQRAction = UIAction(title: "Scan QR Code", image: UIImage(systemName: "qrcode.viewfinder")) { [weak self] _ in
                self?.scanQRCodeButtonTapped()
            }

            let menu = UIMenu(title: "", children: [themeAction, scanQRAction])

            let themeButton = UIBarButtonItem(
                image: UIImage(systemName: "paintbrush.fill"),
                primaryAction: nil,
                menu: menu
            )

            return themeButton
        } else {
            // For iOS versions before 14.0, use a simple button with an alert for menu
            let themeButton = UIBarButtonItem(
                image: UIImage(systemName: "paintbrush.fill") ?? UIImage(),
                style: .plain,
                target: self,
                action: #selector(showLegacyMenu)
            )
            return themeButton
        }
    }

    @objc private func showLegacyMenu() {
        let alertController = UIAlertController(title: "Options", message: nil, preferredStyle: .actionSheet)

        let themeAction = UIAlertAction(title: "Theme Selection", style: .default) { [weak self] _ in
            self?.themeButtonTapped()
        }

        let scanQRAction = UIAlertAction(title: "Scan QR Code", style: .default) { [weak self] _ in
            self?.scanQRCodeButtonTapped()
        }

        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel)

        alertController.addAction(themeAction)
        alertController.addAction(scanQRAction)
        alertController.addAction(cancelAction)

        if let popover = alertController.popoverPresentationController {
            // Set the source for iPad compatibility
            if let rightBarButton = navigationItem.rightBarButtonItems?.first {
                popover.barButtonItem = rightBarButton
            }
        }

        present(alertController, animated: true)
    }

    @objc private func scanQRCodeButtonTapped() {
        // Check camera permission
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .authorized:
            // Already authorized, start scanning
            startQRCodeScanner()
        case .notDetermined:
            // Request permission
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async {
                    if granted {
                        self.startQRCodeScanner()
                    } else {
                        self.showPermissionDeniedAlert()
                    }
                }
            }
        case .denied, .restricted:
            showPermissionDeniedAlert()
        @unknown default:
            showPermissionDeniedAlert()
        }
    }

    private func startQRCodeScanner() {
        // Create capture session
        captureSession = AVCaptureSession()

        guard let captureSession = captureSession else { return }

        // Set session preset
        captureSession.sessionPreset = .medium

        // Get the device
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }

        // Create input
        let videoInput: AVCaptureDeviceInput
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            return
        }

        // Add input to session
        if captureSession.canAddInput(videoInput) {
            captureSession.addInput(videoInput)
        } else {
            return
        }

        // Create metadata output
        let metadataOutput = AVCaptureMetadataOutput()

        if captureSession.canAddOutput(metadataOutput) {
            captureSession.addOutput(metadataOutput)

            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        } else {
            return
        }

        // Create preview layer
        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer?.frame = view.layer.bounds
        previewLayer?.videoGravity = .resizeAspectFill

        // Create frame view for QR code on window to ensure it's always on top
        windowQRCodeFrameView = UIView()
        if let windowQRCodeFrameView = windowQRCodeFrameView {
            windowQRCodeFrameView.layer.insertSublayer(previewLayer!, at: 0)
            windowQRCodeFrameView.layer.borderColor = UIColor.green.cgColor
            windowQRCodeFrameView.layer.borderWidth = 2

            // Add to window's key window to ensure it's always on top
            if #available(iOS 13.0, *) {
                if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                   let window = windowScene.windows.first {
                    window.addSubview(windowQRCodeFrameView)
                    window.bringSubviewToFront(windowQRCodeFrameView)
                }
            } else {
                // Fallback for iOS 12 and earlier
                if let window = UIApplication.shared.keyWindow {
                    window.addSubview(windowQRCodeFrameView)
                    window.bringSubviewToFront(windowQRCodeFrameView)
                } else if let window = UIApplication.shared.windows.first {
                    window.addSubview(windowQRCodeFrameView)
                    window.bringSubviewToFront(windowQRCodeFrameView)
                }
            }
        }

        // Start capture on a background queue to prevent UI blocking
        DispatchQueue.global(qos: .userInitiated).async {
            captureSession.startRunning()
        }
    }

    private func stopQRCodeScanner() {
        captureSession?.stopRunning()

        previewLayer?.removeFromSuperlayer()
        previewLayer = nil

        windowQRCodeFrameView?.removeFromSuperview()
        windowQRCodeFrameView = nil

        captureSession = nil
    }

    private func showPermissionDeniedAlert() {
        // Ensure on main thread and VC is visible
        guard isViewLoaded, view.window != nil else { return }
        
        let alert = UIAlertController(
            title: NSLocalizedString("camera_permission_required", comment: "Camera permission required alert title"),
            message: NSLocalizedString("camera_permission_message", comment: "Camera permission required alert message"),
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: NSLocalizedString("cancel", comment: "Cancel button"), style: .cancel) { [weak self] _ in
            self?.dismiss(animated: true)
        })

        alert.addAction(UIAlertAction(title: NSLocalizedString("go_to_settings", comment: "Go to settings button"), style: .default) { [weak self] _ in
            guard let settingsURL = URL(string: UIApplication.openSettingsURLString) else { return }
            UIApplication.shared.open(settingsURL)
        })

        present(alert, animated: true)
    }

    private func processQRCodeResult(_ qrCode: String) {
        stopQRCodeScanner()

        // Show the scanned result
        let alert = UIAlertController(
            title: "Scan result",
            message: qrCode,
            preferredStyle: .alert
        )

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

        alert.addAction(UIAlertAction(title: "Process", style: .default) { _ in
            // Download and process the QR code content
            self.downloadAndProcessQRCodeFile(qrCode)
        })

        present(alert, animated: true)
    }

    func downloadAndProcessQRCodeFile(_ fileUrl: String) {
        guard let url = URL(string: fileUrl) else {
            showAlert(title: "Error", message: "Invalid URL")
            return
        }

        // Create URLSession configuration with timeout settings
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30.0
        config.timeoutIntervalForResource = 60.0
        let session = URLSession(configuration: config)

        let task = session.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                DispatchQueue.main.async {
                    self.showAlert(title: "Download Failed", message: "Network request error: \(error.localizedDescription)")
                }
                print("❌ [QR Code] Network error: \(error)")
                return
            }

            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                let statusCode = (response as? HTTPURLResponse)?.statusCode ?? -1
                DispatchQueue.main.async {
                    self.showAlert(title: "Download Failed", message: "HTTP status code error: \(statusCode)")
                }
                print("❌ [QR Code] HTTP error: Status code \(statusCode)")
                return
            }

            guard let data = data, !data.isEmpty else {
                DispatchQueue.main.async {
                    self.showAlert(title: "Parse Failed", message: "Server returned empty data")
                }
                print("❌ [QR Code] Empty response data")
                return
            }

            // Check if data is valid UTF8 string
            guard let jsonString = String(data: data, encoding: .utf8) else {
                DispatchQueue.main.async {
                    self.showAlert(title: "Parse Failed", message: "Data encoding error")
                }
                print("❌ [QR Code] Invalid UTF8 encoding")
                return
            }

            do {
                // Parse JSON data
                guard let jsonData = jsonString.data(using: .utf8) else {
                    DispatchQueue.main.async {
                        self.showAlert(title: "Parse Failed", message: "Cannot convert data encoding")
                    }
                    return
                }
                
                let jsonObject = try JSONSerialization.jsonObject(with: jsonData, options: [])
                
                // Validate if array
                guard let jsonArray = jsonObject as? [Any] else {
                    DispatchQueue.main.async {
                        self.showAlert(title: "Parse Failed", message: "Response is not a valid JSON array")
                    }
                    print("❌ [QR Code] Response is not a valid JSON array")
                    return
                }
                
                // Check array length
                if jsonArray.count < 3 {
                    DispatchQueue.main.async {
                        self.showAlert(title: "Parse Failed", message: "JSON array length insufficient, expected at least 3 , actual \(jsonArray.count)")
                    }
                    print("❌ [QR Code] JSON array length insufficient: \(jsonArray.count), expected at least 3")
                    return
                }
                
                var processedCount = 0
                var createSurfaceJson: String?
                var updateComponentsJson: String?
                var updateDataModelJson: String?

                // Process JSON array, extract data more safely
                for (index, item) in jsonArray.enumerated() {
                    // Convert each element back to JSON string
                    if JSONSerialization.isValidJSONObject(item) {
                        if let itemData = try? JSONSerialization.data(withJSONObject: item, options: .sortedKeys),
                           let itemString = String(data: itemData, encoding: .utf8) {
                            
                            switch index {
                            case 0:
                                createSurfaceJson = itemString
                                processedCount += 1
                            case 1:
                                updateComponentsJson = itemString
                                processedCount += 1
                            case 2:
                                updateDataModelJson = itemString
                                processedCount += 1
                            default:
                                break
                            }
                        } else {
                            print("⚠️ [QR Code] Could not convert item at index \(index) back to JSON string")
                        }
                    } else {
                        print("⚠️ [QR Code] Item at index \(index) is not a valid JSON object")
                    }
                }

                DispatchQueue.main.async {
                    self.processQRCodeJsonData(
                        createSurfaceJson: createSurfaceJson,
                        updateComponentsJson: updateComponentsJson,
                        updateDataModelJson: updateDataModelJson
                    )
                }
                
                print("✅ [QR Code] Successfully processed \(processedCount) JSON ")
                
            } catch let jsonError as NSError {
                DispatchQueue.main.async {
                    self.showAlert(title: "Parse Failed", message: "JSON parsing error: \(jsonError.localizedDescription)")
                }
                print("❌ [QR Code] JSON parsing error: \(jsonError)")
                
                // Output first 200 chars of raw data for debugging
                let debugData = String(data: data.prefix(200), encoding: .utf8) ?? "Could not decode"
                print("📋 [QR Code] First 200 chars of response: \(debugData)")
            }
        }
        
        task.resume()
    }

    private func processQRCodeJsonData(createSurfaceJson: String?, updateComponentsJson: String?, updateDataModelJson: String?) {
        surfaceManager.beginTextStream()
        
        // Process createSurface JSON
        if let createSurfaceJson = createSurfaceJson {
            surfaceManager.receiveTextChunk(createSurfaceJson)
            print("✅ [QR Code] Sent createSurface")
        }

        // Process updateComponents JSON
        if let updateComponentsJson = updateComponentsJson {
            surfaceManager.receiveTextChunk(updateComponentsJson)
            print("✅ [QR Code] Sent updateComponents")

            // Save to current variables
            self.currentComponentsJSON = updateComponentsJson
        }

        // Process updateDataModel JSON
        if let updateDataModelJson = updateDataModelJson {
            surfaceManager.receiveTextChunk(updateDataModelJson)
            print("✅ [QR Code] Sent updateDataModel")

            // Save to current variables
            self.currentDataModelJSON = updateDataModelJson
        } else {
            print("✅ [QR Code] updateDataModel is empty, skipping")
        }

        surfaceManager.endTextStream()
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    
   // MARK: - Examples.
    
    /// Mock send JSON data part to renderer.
    ///
    /// - Parameters:
    ///   - componentsJSON: Components JSON string
    ///   - dataModelJSON: DataModel JSON string
    private func sendJSONData(componentsJSON: String?, dataModelJSON: String?) {
        // Process Components JSON
        surfaceManager.beginTextStream()

        if let componentsJSON = componentsJSON {
            // Try to parse JSON and extract surfaceId
            if let data = componentsJSON.data(using: .utf8),
               let jsonObject = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let updateComponents = jsonObject["updateComponents"] as? [String: Any],
               let surfaceId = updateComponents["surfaceId"] as? String {
                
                // First send deleteSurface for previous surfaceId (if exists)
                if let previousSurfaceId = previousSurfaceId {
                    let deleteSurfaceJSON: [String: Any] = [
                        "version": "v0.9",
                        "deleteSurface": [
                            "surfaceId": previousSurfaceId
                        ]
                    ]
                    
                    if let deleteSurfaceData = try? JSONSerialization.data(withJSONObject: deleteSurfaceJSON, options: []),
                       let deleteSurfaceString = String(data: deleteSurfaceData, encoding: .utf8) {
                        surfaceManager.receiveTextChunk(deleteSurfaceString)
                        print("✅ [Main Page] Sent deleteSurface: surfaceId = \(previousSurfaceId)")
                    }
                }
                
                // Then send createSurface
                let createSurfaceJSON: [String: Any] = [
                    "version": "v0.9",
                    "createSurface": [
                        "surfaceId": surfaceId,
                        "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json",
                        "theme": [
                            "primaryColor": "#00BFFF"
                        ],
                        "sendDataModel": true
                    ]
                ]
                
                if let createSurfaceData = try? JSONSerialization.data(withJSONObject: createSurfaceJSON, options: []),
                   let createSurfaceString = String(data: createSurfaceData, encoding: .utf8) {
                    surfaceManager.receiveTextChunk(createSurfaceString)
                    print("✅ [Main Page] Sent createSurface: surfaceId = \(surfaceId)")
                }
                
                // Save current surfaceId for next deletion
                self.previousSurfaceId = surfaceId
            }
            
            // Send Components JSON
            surfaceManager.receiveTextChunk(componentsJSON)
            print("✅ [Main Page] Sent Components data")
        }
        
        // Process DataModel JSON
        if let dataModelJSON = dataModelJSON {
            surfaceManager.receiveTextChunk(dataModelJSON)
            print("✅ [Main Page] Sent DataModel data")
        }
        
        surfaceManager.endTextStream()
    }

    // MARK: - AVCaptureMetadataOutputObjectsDelegate

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        // Stop if no objects detected
        guard let metadataObject = metadataObjects.first else { return }

        // Check if it's a QR code
        guard let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject else { return }
        guard let stringValue = readableObject.stringValue else { return }

        // Animate the scan
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))

        // Update UI on main thread
        DispatchQueue.main.async {
            self.highlightQRCodeFrame(boundingBox: readableObject.bounds)
            self.processQRCodeResult(stringValue)
        }
    }

    private func highlightQRCodeFrame(boundingBox: CGRect) {
        guard let windowQRCodeFrameView = self.windowQRCodeFrameView,
              let previewLayer = self.previewLayer else { return }

        // Convert bounding box to view coordinates
        let convertedBoundingBox = previewLayer.layerRectConverted(fromMetadataOutputRect: boundingBox)

        // Convert from layer coordinates to window coordinates
        let windowCoordinates = view.convert(convertedBoundingBox, to: nil)

        windowQRCodeFrameView.frame = windowCoordinates

        // Ensure QR code frame view stays on top
        if let superview = windowQRCodeFrameView.superview {
            superview.bringSubviewToFront(windowQRCodeFrameView)
        }
    }
}
