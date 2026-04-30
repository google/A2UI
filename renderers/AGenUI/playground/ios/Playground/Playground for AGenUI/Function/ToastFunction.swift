//
//  ToastFunction.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/4/29.
//

import UIKit
import AGenUI

class ToastFunction: NSObject, Function {

    var functionConfig: FunctionConfig {
        return FunctionConfig(name: "toast")
    }

    func execute(_ params: String) -> FunctionResult {
        guard let data = params.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let value = json["value"] as? String,
              !value.isEmpty else {
            return FunctionResult.failure(value: ["error": "Invalid or missing 'value' parameter"])
        }

        DispatchQueue.main.async {
            self.showToast(message: value)
        }

        return FunctionResult.success(value: [:])
    }

    private func showToast(message: String) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else {
            return
        }

        let toastLabel = UILabel()
        toastLabel.text = message
        toastLabel.textColor = .white
        toastLabel.backgroundColor = UIColor.black.withAlphaComponent(0.75)
        toastLabel.textAlignment = .center
        toastLabel.font = .systemFont(ofSize: 14)
        toastLabel.numberOfLines = 0
        toastLabel.alpha = 0
        toastLabel.layer.cornerRadius = 8
        toastLabel.clipsToBounds = true

        let maxWidth = window.bounds.width - 80
        let textSize = toastLabel.sizeThatFits(CGSize(width: maxWidth, height: CGFloat.greatestFiniteMagnitude))
        let labelWidth = min(textSize.width + 32, maxWidth)
        let labelHeight = textSize.height + 20

        toastLabel.frame = CGRect(
            x: (window.bounds.width - labelWidth) / 2,
            y: window.bounds.height - labelHeight - 120,
            width: labelWidth,
            height: labelHeight
        )

        window.addSubview(toastLabel)

        UIView.animate(withDuration: 0.3, animations: {
            toastLabel.alpha = 1
        }) { _ in
            UIView.animate(withDuration: 0.3, delay: 2.0, options: [], animations: {
                toastLabel.alpha = 0
            }) { _ in
                toastLabel.removeFromSuperview()
            }
        }
    }
}
