// Razorpay Handler
// This function opens the Razorpay checkout modal
// It is called from Python using rx.call_script

window.openRazorpay = function(options) {
    // Define the handler for success
    options.handler = function (response) {
        // On success, click the hidden button to trigger the Reflex event
        // We can pass the payment ID back if needed, but for now we just trigger success
        console.log("Payment successful: " + response.razorpay_payment_id);
        
        // Find the hidden button
        const btn = document.getElementById("razorpay-success-btn");
        if (btn) {
            btn.click();
        } else {
            console.error("Razorpay success button not found!");
        }
    };
    
    // Initialize and open Razorpay
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response){
        console.error("Payment failed: " + response.error.description);
        alert("Payment failed: " + response.error.description);
    });
    
    rzp1.open();
};
