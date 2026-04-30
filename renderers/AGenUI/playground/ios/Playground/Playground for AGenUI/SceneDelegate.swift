//
//  SceneDelegate.swift
//  Playground
//
//  Created by guolicheng on 2026/3/20.
//

import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?


    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // Use this method to optionally configure and attach the UIWindow `window` to the provided UIWindowScene `scene`.
        // If using a storyboard, the `window` property will automatically be initialized and attached to the scene.
        // This delegate does not imply the connecting scene or session are new (see `application:configurationForConnectingSceneSession` instead).
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        // Create window
        let window = UIWindow(windowScene: windowScene)
        
        // Create Playground view controller
        let playgroundVC = A2UIPlaygroundViewController()
        
        // Embed in navigation controller
        let navigationController = UINavigationController(rootViewController: playgroundVC)
        
        // Set as root view controller
        window.rootViewController = navigationController
        
        // Show window
        window.makeKeyAndVisible()
        self.window = window
        
        // Example code: ViewController
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        // Called as the scene is being released by the system.
        // This occurs shortly after the scene enters the background, or when its session is discarded.
        // Release any resources associated with this scene that can be re-created the next time the scene connects.
        // The scene may re-connect later, as its session was not necessarily discarded (see `application:didDiscardSceneSessions` instead).
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        // Called when the scene has moved from an inactive state to an active state.
        // Use this method to restart any tasks that were paused (or not yet started) when the scene was inactive.
    }

    func sceneWillResignActive(_ scene: UIScene) {
        // Called when the scene will move from an active state to an inactive state.
        // This may occur due to temporary interruptions (ex. an incoming phone call).
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        // Called as the scene transitions from the background to the foreground.
        // Use this method to undo the changes made on entering the background.
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        // Called as the scene transitions from the foreground to the background.
        // Use this method to save data, release shared resources, and store enough scene-specific state information
        // to restore the scene back to its current state.
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        handleDeepLink(url: url)
    }

    private func handleDeepLink(url: URL) {
        guard url.scheme == "playground",
              url.host == "a2ui_test" else {
            return
        }

        // Parse URL query parameters
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems,
              let fileUrl = queryItems.first(where: { $0.name == "url" })?.value else {
            print("⚠️ [DeepLink] Missing 'url' parameter in: \(url)")
            return
        }

        print("✅ [DeepLink] Received a2ui_test URL: \(fileUrl)")

        // Get A2UIPlaygroundViewController and invoke download processing
        DispatchQueue.main.async {
            guard let navController = self.window?.rootViewController as? UINavigationController,
                  let playgroundVC = navController.viewControllers.first as? A2UIPlaygroundViewController else {
                print("❌ [DeepLink] Failed to get A2UIPlaygroundViewController")
                return
            }
            playgroundVC.downloadAndProcessQRCodeFile(fileUrl)
        }
    }

}

