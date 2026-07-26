import { Router } from "express";

const router = Router();

// Published policy pages — shown via the "Open Full …" button in the app.
const EXTERNAL_URLS: Record<string, string> = {
  terms: "https://www.odialifehub.in/p/terms-conditions-for-jajpur-jatri.html",
  privacy: "https://www.odialifehub.in/p/privacy-policy-for-jajpur-jatri.html",
  refund: "https://www.odialifehub.in/p/jajpur-jatri-refund-cancellation-policy.html",
};

const LEGAL_DOCS: Record<string, { title: string; body: string }> = {
  terms: {
    title: "Terms & Conditions",
    body: `Welcome to Jajpur Jatri. By using our service, you agree to these terms.

1. SERVICE USE
Jajpur Jatri connects passengers with drivers for transportation services within Jajpur and surrounding areas.

2. USER ACCOUNTS
You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.

3. DRIVER STANDARDS
All drivers must hold a valid driving licence and comply with local transport regulations. Drivers must maintain vehicle roadworthiness at all times.

4. PAYMENTS
Fares are calculated at ₹15 per kilometre. Payment can be made via cash, wallet, or online payment. All transactions are final unless a dispute is raised within 24 hours.

5. CANCELLATIONS
Passengers may cancel a ride before a driver is assigned. Repeated cancellations may result in account suspension.

6. LIABILITY
Jajpur Jatri is a technology platform connecting passengers and drivers. We are not liable for incidents during the ride beyond what is required by applicable law.

7. PRIVACY
We collect and process your data as described in our Privacy Policy. Location data is used only during active rides.

8. CHANGES
We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.

For questions, contact support at jajpurjatri@gmail.com or call +91 9583789411.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `Jajpur Jatri respects your privacy. This policy explains what data we collect and how we use it.

1. DATA WE COLLECT
- Phone number and name for account creation
- Location data during active rides
- Payment information (processed securely; we do not store card details)
- Trip history and ratings

2. HOW WE USE YOUR DATA
- To connect you with drivers or passengers
- To process payments and maintain wallet balance
- To improve the service and resolve disputes
- To send service notifications (no marketing without consent)

3. DATA SHARING
We share your name and phone number with your matched driver/passenger for coordination purposes only. We do not sell your data to third parties.

4. LOCATION DATA
Driver location is tracked only during active rides. Passenger location is used to find nearby drivers. No location data is retained after ride completion beyond aggregated statistics.

5. DATA RETENTION
Account data is retained while your account is active. You may request deletion by contacting support.

6. SECURITY
We use industry-standard encryption for all data in transit. Passwords are hashed and never stored in plain text.

7. CONTACT
For privacy questions, contact jajpurjatri@gmail.com or call +91 9583789411.`,
  },
  refund: {
    title: "Refund & Cancellation Policy",
    body: `This policy explains cancellations and refunds for Jajpur Jatri rides and wallet payments.

1. RIDE CANCELLATION
You may cancel a ride free of charge before a driver is assigned. Once a driver has been assigned and is on the way, a cancellation fee may apply.

2. CANCELLATION FEE
A cancellation fee of up to ₹25 may be charged if you cancel after a driver has started travelling to your pickup point.

3. DRIVER CANCELLATION
If a driver cancels, you are not charged. Any amount already deducted is credited back to your wallet.

4. WALLET REFUNDS
Amounts deducted in error are credited back to your Jajpur Jatri wallet, usually within 24 hours.

5. ONLINE PAYMENT REFUNDS
Refunds for online payments are processed to the original payment method and may take 5-7 working days depending on your bank.

6. DISPUTES
Raise any fare or payment dispute within 24 hours of the ride through the app's Support section.

For refund queries, contact jajpurjatri@gmail.com or call +91 9583789411.`,
  },
};

router.get("/legal/:slug", (req, res) => {
  let { slug } = req.params;
  // The app uses variants like privacy-passenger / privacy-driver — normalize them.
  if (slug.startsWith("privacy")) slug = "privacy";
  else if (slug.startsWith("terms")) slug = "terms";
  else if (slug.startsWith("refund") || slug.startsWith("cancel")) slug = "refund";
  const doc = LEGAL_DOCS[slug];
  if (!doc) {
    res.status(404).json({ message: "Document not found" });
    return;
  }
  res.json({
    slug,
    title: doc.title,
    body: doc.body,
    externalUrl: EXTERNAL_URLS[slug] ?? null,
  });
});

export default router;
