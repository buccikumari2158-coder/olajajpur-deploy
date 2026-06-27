import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Language = "en" | "or";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  hasSelected: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: "Jajpur Jatri",
    tagline: "Safe Rides, Anytime, Anywhere",
    selectLanguage: "Choose Language",
    selectLanguageDesc: "Select your preferred language",
    english: "English",
    odia: "ଓଡ଼ିଆ (Odia)",
    continue: "Continue",
    login: "Welcome Back",
    loginDesc: "Login to continue",
    phoneNumber: "Phone Number",
    sendOtp: "Send OTP",
    enterOtp: "Enter OTP",
    otpDesc: "We have sent a 6 digit code to",
    verifyOtp: "Verify OTP",
    resendOtp: "Resend OTP",
    whereToGo: "Where to go?",
    pickupLocation: "Pickup Location",
    dropLocation: "Drop Location",
    currentLocation: "Current Location",
    chooseRide: "Choose a ride",
    confirmRide: "Confirm Ride",
    searchingDriver: "Searching for nearby drivers...",
    driverAssigned: "Driver Assigned",
    driverOnWay: "Driver is on the way",
    liveTracking: "Live Tracking",
    payment: "Payment",
    totalFare: "Total Fare",
    cash: "Cash",
    wallet: "Wallet",
    onlinePayment: "Online Payment",
    confirmPayment: "Confirm Payment",
    rideComplete: "Ride Completed",
    rateRide: "Rate your ride",
    activity: "Activity",
    walletTitle: "My Wallet",
    addMoney: "Add Money",
    recentTransactions: "Recent Transactions",
    profile: "Profile",
    myRides: "My Rides",
    paymentMethods: "Payment Methods",
    savedAddresses: "Saved Addresses",
    settings: "Settings",
    helpSupport: "Help & Support",
    logout: "Logout",
    driverDashboard: "Driver Dashboard",
    online: "Online",
    offline: "Offline",
    todaysEarnings: "Today's Earnings",
    totalRides: "Total Rides",
    newRideRequest: "New Ride Request",
    accept: "Accept",
    reject: "Reject",
    navigation: "Navigation",
    earnings: "Earnings",
    trips: "Trips",
    becomeDriver: "Become a Driver",
    driverReg: "Driver Registration",
    pending: "Application Pending",
    pendingDesc: "Your driver application is under review. You will be notified once approved.",
    bike: "Bike",
    auto: "Auto",
    km: "km",
    min: "min",
    home: "Home",
    cancelRide: "Cancel Ride",
    sos: "SOS",
    distance: "Distance",
    duration: "Time",
    fare: "Fare",
    otp: "OTP",
    otpShare: "Share this OTP with your driver",
    backToHome: "Back to Home",
    done: "Done",
    submitApplication: "Submit Application",
    next: "Next",
    previous: "Previous",
    fullName: "Full Name",
    email: "Email",
    address: "Address",
    vehicleType: "Vehicle Type",
    vehicleNumber: "Vehicle Number",
    vehicleModel: "Vehicle Model",
    uploadAadhaar: "Upload Aadhaar Card",
    uploadLicense: "Upload Driving License",
    uploadRC: "Upload Vehicle RC",
    uploadVehiclePhoto: "Upload Vehicle Photo",
    earnings_daily: "Daily",
    earnings_weekly: "Weekly",
    earnings_monthly: "Monthly",
    noRides: "No rides yet",
    noTransactions: "No transactions yet",
    serviceLimit: "Service unavailable beyond 30 KM",
    callDriver: "Call",
    message: "Message",
    completeRide: "Complete Ride",
    startRide: "Start Ride",
    arrivedPickup: "Arrived at Pickup",
    rideStarted: "Ride Started",
    selectVehicle: "Select vehicle type",
    enterPhone: "Enter phone number",
    new: "NEW",
    apply: "Apply for Driver",
    termsAgree: "I agree to the terms and conditions",
    uploadPhoto: "Upload Photo",
  },
  or: {
    appName: "ଯାଜପୁର ଯାତ୍ରୀ",
    tagline: "ସୁରକ୍ଷିତ ଯାତ୍ରା, ଯେକୌଣସି ସମୟ, ଯେକୌଣସି ସ୍ଥାନ",
    selectLanguage: "ଭାଷା ଚୟନ କରନ୍ତୁ",
    selectLanguageDesc: "ଆପଣଙ୍କ ପ୍ରିୟ ଭାଷା ବାଛନ୍ତୁ",
    english: "English",
    odia: "ଓଡ଼ିଆ (Odia)",
    continue: "ଜାରି ରଖନ୍ତୁ",
    login: "ସ୍ୱାଗତ",
    loginDesc: "ଲଗଇନ୍ ଜାରି ରଖନ୍ତୁ",
    phoneNumber: "ଫୋନ୍ ନମ୍ବର",
    sendOtp: "OTP ପଠାନ୍ତୁ",
    enterOtp: "OTP ପ୍ରବେଶ କରନ୍ତୁ",
    otpDesc: "ଆମେ ଏକ 6 ଅଙ୍କ ବିଶିଷ୍ଟ କୋଡ୍ ପଠାଇଛୁ",
    verifyOtp: "OTP ଯାଞ୍ଚ କରନ୍ତୁ",
    resendOtp: "OTP ପୁଣି ପଠାନ୍ତୁ",
    whereToGo: "କୁଆଡ଼େ ଯିବେ?",
    pickupLocation: "ପିକ୍ଅପ ସ୍ଥାନ",
    dropLocation: "ଡ୍ରପ ସ୍ଥାନ",
    currentLocation: "ବର୍ତ୍ତମାନ ସ୍ଥାନ",
    chooseRide: "ଯାନ ବାଛନ୍ତୁ",
    confirmRide: "ଯାତ୍ରା ନିଶ୍ଚିତ କରନ୍ତୁ",
    searchingDriver: "ନିକଟବର୍ତ୍ତୀ ଡ୍ରାଇଭର ଖୋଜୁଛି...",
    driverAssigned: "ଡ୍ରାଇଭର ଆସଛନ୍ତି",
    driverOnWay: "ଡ୍ରାଇଭର ରାସ୍ତାରେ ଅଛନ୍ତି",
    liveTracking: "ଲାଇଭ ଟ୍ରାକିଂ",
    payment: "ଭୁଗତାନ",
    totalFare: "ମୋଟ ଭଡ଼ା",
    cash: "ନଗଦ",
    wallet: "ୱ୍ୟାଲେଟ",
    onlinePayment: "ଅନଲାଇନ ଭୁଗତାନ",
    confirmPayment: "ଭୁଗତାନ ନିଶ୍ଚିତ",
    rideComplete: "ଯାତ୍ରା ସଂପୂର୍ଣ",
    rateRide: "ଯାତ୍ରା ମୂଲ୍ୟାଙ୍କ",
    activity: "ଗତିବିଧି",
    walletTitle: "ମୋ ୱ୍ୟାଲେଟ",
    addMoney: "ଟଙ୍କା ଯୋଡ଼ନ୍ତୁ",
    recentTransactions: "ଇତ୍ୟାସ",
    profile: "ପ୍ରୋଫାଇଲ",
    myRides: "ମୋ ଯାତ୍ରା",
    paymentMethods: "ଭୁଗତାନ ପଦ୍ଧତି",
    savedAddresses: "ସଂରକ୍ଷିତ ଠିକଣା",
    settings: "ସେଟିଂସ",
    helpSupport: "ସହାୟତା",
    logout: "ଲଗଆଉଟ",
    driverDashboard: "ଡ୍ରାଇଭର ଡ୍ୟାଶବୋର୍ଡ",
    online: "ଅନଲାଇନ",
    offline: "ଅଫଲାଇନ",
    todaysEarnings: "ଆଜ ର ଉପାର୍ଜନ",
    totalRides: "ମୋଟ ଯାତ୍ରା",
    newRideRequest: "ନୂଆ ଯାତ୍ରା ଅନୁରୋଧ",
    accept: "ଗ୍ରହଣ",
    reject: "ପ୍ରତ୍ୟାଖ୍ୟାନ",
    navigation: "ଦିଗ ନିର୍ଦ୍ଦେଶ",
    earnings: "ଉପାର୍ଜନ",
    trips: "ଯାତ୍ରା",
    becomeDriver: "ଡ୍ରାଇଭର ହୁଅନ୍ତୁ",
    driverReg: "ଡ୍ରାଇଭର ପଞ୍ଜୀକରଣ",
    pending: "ଆବେଦନ ଅପେକ୍ଷାରତ",
    pendingDesc: "ଆପଣଙ୍କ ଡ୍ରାଇଭର ଆବେଦନ ସମୀକ୍ଷା ଅଧୀନ ଅଛି",
    bike: "ବାଇକ",
    auto: "ଅଟୋ",
    km: "କିମି",
    min: "ମିନିଟ",
    home: "ଘର",
    cancelRide: "ଯାତ୍ରା ବାତିଲ",
    sos: "SOS",
    distance: "ଦୂରତ୍ୱ",
    duration: "ସମୟ",
    fare: "ଭଡ଼ା",
    otp: "OTP",
    otpShare: "ଡ୍ରାଇଭରଙ୍କ ସହ ଏହି OTP ଅଂଶୀଦାର କରନ୍ତୁ",
    backToHome: "ଘରକୁ ଫେରନ୍ତୁ",
    done: "ସଂପୂର୍ଣ",
    submitApplication: "ଆବେଦନ ଦାଖଲ",
    next: "ପରବର୍ତ୍ତୀ",
    previous: "ପୂର୍ବବର୍ତ୍ତୀ",
    fullName: "ପୂର୍ଣ ନାମ",
    email: "ଇମେଲ",
    address: "ଠିକଣା",
    vehicleType: "ଯାନ ପ୍ରକାର",
    vehicleNumber: "ଯାନ ନମ୍ବର",
    vehicleModel: "ଯାନ ମଡେଲ",
    uploadAadhaar: "ଆଧାର ଅପଲୋଡ",
    uploadLicense: "ଡ୍ରାଇଭିଂ ଲାଇସେନ୍ସ",
    uploadRC: "RC ଅପଲୋଡ",
    uploadVehiclePhoto: "ଯାନ ଫଟୋ",
    earnings_daily: "ଦୈନନ୍ଦିନ",
    earnings_weekly: "ସାପ୍ତାହିକ",
    earnings_monthly: "ମାସିକ",
    noRides: "ଯାତ୍ରା ନାହିଁ",
    noTransactions: "ଲେଣଦେଣ ନାହିଁ",
    serviceLimit: "30 KM ବାହାରେ ସେବା ଉପଲବ୍ଧ ନୁହେଁ",
    callDriver: "କଲ",
    message: "ବାର୍ତ୍ତା",
    completeRide: "ଯାତ୍ରା ସଂପୂର୍ଣ",
    startRide: "ଯାତ୍ରା ଆରମ୍ଭ",
    arrivedPickup: "ପିକ୍ଅପ ପହଞ୍ଚିଲି",
    rideStarted: "ଯାତ୍ରା ଆରମ୍ଭ",
    selectVehicle: "ଯାନ ଚୟନ",
    enterPhone: "ଫୋନ ନମ୍ବର ଦିଅନ୍ତୁ",
    new: "ନୂଆ",
    apply: "ଡ୍ରାଇଭର ଆବେଦନ",
    termsAgree: "ମୁଁ ସର୍ତ୍ତ ଓ ଶର୍ତ ସହ ସହମତ",
    uploadPhoto: "ଫଟୋ ଅପଲୋଡ",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((lang) => {
      if (lang === "en" || lang === "or") {
        setLanguageState(lang);
        setHasSelected(true);
      }
    });
  }, []);

  function setLanguage(lang: Language) {
    setLanguageState(lang);
    setHasSelected(true);
    AsyncStorage.setItem("app_language", lang);
  }

  function t(key: string): string {
    return translations[language][key] ?? translations["en"][key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, hasSelected }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
