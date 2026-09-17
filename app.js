const GOOGLE_MERCHANT_ID = "BCR2DN6D5L5K3DL5";
const SUMUP_MERCHANT_CODE = "M922Z9TB";
const PAYMENTS_API = "https://195.20.233.98/api_create_payment.php";

let paymentsClient;

const baseCardPaymentMethod = {
  type: "CARD",
  parameters: {
    allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
    allowedCardNetworks: ["VISA", "MASTERCARD"]
  },
  tokenizationSpecification: {
    type: "PAYMENT_GATEWAY",
    parameters: {
      gateway: "sumup",
      gatewayMerchantId: SUMUP_MERCHANT_CODE
    }
  }
};

window.addEventListener("load", initGooglePay);

async function initGooglePay() {
  const message = document.getElementById("payment-message");
  const container = document.getElementById("sumup-pay-button");

  if (!window.google || !google.payments) {
    message.textContent = "Google Pay library failed to load.";
    return;
  }

  paymentsClient = new google.payments.api.PaymentsClient({
    environment: "PRODUCTION"
  });

  try {
    const ready = await paymentsClient.isReadyToPay({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [baseCardPaymentMethod]
    });

    if (!ready.result) {
      message.textContent = "Google Pay isn't available on this device.";
      return;
    }

    const gpayButton = paymentsClient.createButton({
      onClick: onGooglePayClicked,
      buttonColor: "black",
      buttonType: "pay"
    });

    container.replaceWith(gpayButton);

  } catch (err) {
    console.error(err);
    message.textContent = "Unable to initialise Google Pay.";
  }
}

async function onGooglePayClicked() {
  try {
    const response = await fetch(PAYMENTS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    const checkout = await response.json();

    if (!checkout.success) {
      throw new Error(checkout.error || "Unable to create SumUp checkout.");
    }

    const paymentRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [baseCardPaymentMethod],
      merchantInfo: {
        merchantId: GOOGLE_MERCHANT_ID,
        merchantName: "Neith Stays"
      },
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPrice: "5.00",
        currencyCode: "GBP",
        countryCode: "GB"
      }
    };

    await paymentsClient.loadPaymentData(paymentRequest);

    // After Google Pay authorises, continue to SumUp checkout.
    window.location.href = checkout.checkout_url;

  } catch (err) {
    console.error("Google Pay error:", err);

    const message = document.getElementById("payment-message");
    if (message) {
      message.textContent = "Google Pay could not be started. Please try again.";
    }
  }
}
