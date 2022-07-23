/*
    Global variables
*/
let totalNavigationSteps = 0; // A count of the navigation steps to make the styling programatic
let successArray = []; // An array of numbers that successfully received the message
let sendCost = 0; // Cumulative cost of sent messages
let currencyCode = ""; // Currency code for the country of the Telnyx API account
let emergencyStop = false; // Boolean - If there is an error stop sending further messages
let accountBalance = 0; // Current Telnyx account balance
let successTotal = 0; // Counter for successfully sent messages
let errorTotal = 0; // Counter for failed messages
let internationalCode = ""; // The international code taken from the send from number
let numbersToSendSMS = []; // An array to hold sanitised numbers for checking
let duplicateNumbersArray = []; // An array to hold all of the duplicate numbers
let unableToSanitise = []; // An array of numbers that could not be sanitised so must be missing a country code
let invalidNumbers = []; // An array of numbers that are invalid and will not reach their destination
let disableNavCheck = false; // Boolean navigation status be rechecked
let disabledNav = { // An object to detect which stage the user is at
    step1: {
        formInput: {
            api: false,
            sendFrom: false
        },
        htmlElements: ["step1-continue", "tab-step2"]
    },
    step2: {
        formInput: {
            numberList: false
        },
        htmlElements: ["step2-continue", "tab-step3"]
    },
    step3: {
        formInput: {
            smsMessage: false
        },
        htmlElements: ["step3-continue", "tab-step4"]
    },
    step4: {
        formInput: {
            sendSMS: false
        },
        htmlElements: ["tab-step5"]
    }
};
const apiURL = { // API details
    balance: "https://api.telnyx.com/v2/balance",
    message: "https://api.telnyx.com/v2/messages"
};

/*
    Set to enable async delay
*/
const delay = async (ms = 1000) =>
    new Promise(resolve => setTimeout(resolve, ms));

/*
    Listen for document ready
*/
document.addEventListener('DOMContentLoaded', countNavigationSteps, false);
/*
    Listeners for form input
*/
document.getElementById("textMessageInput").onchange = function () {
    let textMessageValue = this.value;
    textMessageInputChange(textMessageValue);
};

document.getElementById("textMessageInput").onkeyup = function () {
    let textMessageValue = this.value;
    textMessageInputChange(textMessageValue);
};

document.getElementById("phoneNumberInput").onchange = function () {
    phoneNumberInputChange();
};

document.getElementById("phoneNumberInput").onkeyup = function () {
    phoneNumberInputChange();
};

document.getElementById("telnyxSendFrom").onchange = function () {
    telnyxSendFromChange(this.value);
};

document.getElementById("telnyxSendFrom").onkeyup = function () {
    telnyxSendFromChange(this.value);
};

document.getElementById("apiKey").onchange = function () {
    getAccountInfo();
};

document.getElementById("apiKey").onkeyup = function () {
    getAccountInfo();
};

/*
    Reset the application to send again
*/
    
function resetApplication() {
    disableNavCheck = false;
    updateNavigationStatus("step2", "numberList", false);
    updateNavigationStatus("step3", "smsMessage", false);
    updateNavigationStatus("step4", "sendSMS", false);
    resetVariables();
    calculateProgress(2);
    
    document.getElementById("phoneNumberInput").value = "";
    document.getElementById("textMessageInput").value = "";
    document.getElementById("confirmationSending").innerHTML = "Sending in Progress...";
    document.getElementById("confirmationSendingStatus").innerHTML = "";
    
    document.getElementById("confirmationSuccessNumber").classList.remove("hide-element");
    document.getElementById("confirmationErrorNumber").classList.remove("hide-element");
    document.getElementById("confirmationCosts").classList.remove("hide-element");
    document.getElementById("confirmationNewBalance").classList.remove("hide-element");
    document.getElementById("tab-step1").classList.remove("nav-disabled");
    document.getElementById("numberSendStatusContainer").classList.add("hide-element");
    document.getElementById("invalidNumbers").classList.add("hide-element");
    document.getElementById("missingCountryCodeErrors").classList.add("hide-element");
    document.getElementById("duplicateNumbers").classList.add("hide-element");
    document.getElementById("phoneNumberInput").classList.remove("form__section-error");
    document.getElementById("phoneNumberInput").classList.remove("form__section-some-error");
    
    phoneNumberInputChange();
    textMessageInputChange("");
    goToTab(1);
}

/************************************************************************************************************************************************************************/

/*
    Functions called from listeners
*/
function textMessageInputChange(textMessageValue) {
    const characterCount = textMessageValue.length;
    
    if (characterCount === 0) {
        updateNavigationStatus("step3", "smsMessage", false);
    } else {
        updateNavigationStatus("step3", "smsMessage", true);
    }
    
    const totalMessagesToSend = calculateSMSCharacterLength(textMessageValue);
    
    document.getElementById("characterCount").innerHTML = "Characters: " + textMessageValue.length;
    document.getElementById("smsCount").innerHTML = "SMS Messages: " + totalMessagesToSend;
    document.getElementById("totalCharacters").innerHTML = "Message contains <b>" + textMessageValue.length + "</b> characters.";
    
    if (totalMessagesToSend <= 1) {
        document.getElementById("totalMessages").innerHTML = "Sending <b>" + totalMessagesToSend + "</b> SMS message to each number.";
    } else {
        document.getElementById("totalMessages").innerHTML = "Sending <b>" + totalMessagesToSend + "</b> SMS messages to each number.";
    }
    
    document.getElementById("messageToSendConfirmation").innerHTML = textMessageValue;
}

function phoneNumberInputChange() {
    document.getElementById("textMessageInput").classList.remove("form__section-error");
    updateNavigationStatus("step2", "numberList", false);
    startPhoneNumberCheck();
}

function telnyxSendFromChange(sendFromNumber) {
    internationalCode = "";
    updateNavigationStatus("step1", "sendFrom", false);
    
    document.getElementById("telnyxSendFrom").classList.add("form__section-error");
    
    if (sendFromNumber.length < 5) {
        return;
    }
    
    const numberDetails = window.libphonenumber.parsePhoneNumber(sendFromNumber);
    
    if ("country" in numberDetails) {
        internationalCode = "+" + numberDetails.countryCallingCode;
        document.getElementById("telnyxSendFrom").classList.remove("form__section-error");
        updateNavigationStatus("step1", "sendFrom", true);
    }

    return;
}

/************************************************************************************************************************************************************************/

/*
    This function toggles the visibility of div elements based on a checkbox value
*/
function toggleAlphanumericSMS() {
    const alphanumbericCheck = document.getElementById("alphanumericCheck");

    if (alphanumbericCheck.checked) {
        const alphanumbericInput = document.getElementById("alphanumericInput");

        alphanumbericInput.classList.remove("hide-element");
    } else {
        const alphanumbericInput = document.getElementById("alphanumericInput");

        alphanumbericInput.classList.add("hide-element");
    }
}

/*
    The function called to send SMS messages
    Puts together the needed details and selects the send method. async or sync.
*/
function sendSMS() {
    updateNavigationStatus("step4", "sendSMS", true);
    resetVariables();
    
    const postDetails = {
        smsMessage: document.getElementById("textMessageInput").value,
        apiKey: document.getElementById("apiKey").value,
        telnyxNumber: document.getElementById("telnyxSendFrom").value,
        alphaNumbericName: document.getElementById("telnyxAlphanumericName").value,
        messagingProfile: document.getElementById("telnyxMessagingProfile").value,
        numberArray: numbersToSendSMS,
    };
    const numbersToSendSMSLength = numbersToSendSMS.length;

    nextTab(4);
    disableAllNavigation(true);
    sendSMSAsync(postDetails, numbersToSendSMSLength);
}

/*
    Resent all the variables so it's a clean send
*/
function resetVariables() {
    emergencyStop = false;
    sendCost = 0;
    errorTotal = 0;
    successTotal = 0;
    successArray = [];
}

/*
    Check the phone numbers entered
*/
function startPhoneNumberCheck() {
    duplicateNumbersArray = [];
    document.getElementById("totalNumbers").innerHTML = "";

    if (document.getElementById("phoneNumberInput").value == "") {
        return;
    }

    numbersToSendSMS = cleanNumbersReturnArray(document.getElementById("phoneNumberInput").value);
    const totalNumbers = numbersToSendSMS.length;

    if (totalNumbers === 0 && unableToSanitise.length === 0) {
        return;
    }

    if (totalNumbers === 1) {
        document.getElementById("totalNumbers").innerHTML = "Send SMS to <b>" + totalNumbers + "</b> number.";
        document.getElementById("totalSendTo").innerHTML = "Send SMS to <b>" + totalNumbers + "</b> number.";
    } else {
        document.getElementById("totalNumbers").innerHTML = "Send SMS to <b>" + totalNumbers + "</b> numbers.";
        document.getElementById("totalSendTo").innerHTML = "Send SMS to <b>" + totalNumbers + "</b> numbers.";
    }
    
    document.getElementById("confirmationSuccessNumber").innerHTML = "0 messages sent of " + totalNumbers;
    
    checkForNumberErrors(numbersToSendSMS);
    checkForDuplicateNumbers(numbersToSendSMS);
}

/*
    Handle successfully sent messages
*/
function sendSuccess(response) {
    const sanitisedResponse = JSON.parse(response);
    const successNumber = sanitisedResponse.data.to[0].phone_number;

    if (sanitisedResponse.data.cost.amount === null) {
        return;
    }

    sendCost += parseFloat(sanitisedResponse.data.cost.amount);
    successArray.push(successNumber);
    
    const totalSuccessNumbers = successArray.length;
    
    if (totalSuccessNumbers === 1) {
        document.getElementById("confirmationSuccessNumber").innerHTML = "<b>" + totalSuccessNumbers + " message sent successfully</b>";
    } else {
        document.getElementById("confirmationSuccessNumber").innerHTML = "<b>" + totalSuccessNumbers + " messages sent successfully</b>";
    }
}

/*
    Handle when sending is complete. Display success and error messagse
*/
async function displayComplete() {
    await delay(500);

    if (emergencyStop === true) {
        fatalErrorDetected();
        
        return;
    }

    const totalSuccessNumbers = successArray.length;

    accountBalance = accountBalance - sendCost;
    
    document.getElementById("confirmationSendingStatus").innerHTML = "Sending complete.";
    document.getElementById("accountBalance").innerHTML = "<b>Current balance</b>: " + String((accountBalance - sendCost).toFixed(2)) + " " + currencyCode;
    document.getElementById("confirmationNewBalance").innerHTML = "Balance after sending messages: " + String((accountBalance - sendCost).toFixed(2)) + " " + currencyCode;
    document.getElementById("confirmationCosts").innerHTML = "Total cost of sent messages: " + sendCost.toFixed(3) + " " + currencyCode;
    
    if (totalSuccessNumbers === 1) {
        document.getElementById("confirmationSuccessNumber").innerHTML = "<b>" + totalSuccessNumbers + " message sent successfully</b>";
    } else {
        document.getElementById("confirmationSuccessNumber").innerHTML = "<b>" + totalSuccessNumbers + " messages sent successfully</b>";
    }
    
    document.getElementById("confirmationSending").innerHTML = "All message sent.";
    document.getElementById("confirmationSendingIcon").classList.add("hide-element");
    document.getElementById("confirmationFatalIcon").classList.add("hide-element");
    document.getElementById("confirmationSentIcon").classList.remove("hide-element");
    
    buildSuccessFailureArray() ;
}

function buildSuccessFailureArray() {
    let appendToArray = [];
    const failedToSendMessages = numbersToSendSMS.filter(x => !successArray.includes(x));
    
    appendToArray = createSendCompleteCSVArray(appendToArray, failedToSendMessages, "Error");
    appendToArray = createSendCompleteCSVArray(appendToArray, successArray, "Success");
    
    createCSVForSendStatusDownload(appendToArray, "sms_sent_status_summary");
    
    document.getElementById("numberSendStatusContainer").classList.remove("hide-element");
}

/*
    When clicking the continue button this function will run
    It first checks if the tab should be active based on the status of the input fields
*/
function nextTab(tabNumber) {
    checkNavigationStatus ();
    
    if (document.getElementById("tab-step" + (tabNumber + 1)).classList.contains("nav-disabled")) {
        return;
    }
    
    const currentTab = document.getElementById("step" + tabNumber);
    const nextTab = document.getElementById("step" + (tabNumber + 1));
    const currentTabNavBar = document.getElementById("tab-step" + tabNumber);
    const nextTabNavBar = document.getElementById("tab-step" + (tabNumber + 1));
    
    currentTab.classList.add("hide-element");
    nextTab.classList.remove("hide-element");
    currentTabNavBar.classList.remove("active");
    nextTabNavBar.classList.add("active");
}

/*
    When clicking the back button this function will run
    It first checks if the tab should be active based on the status of the input fields
*/
function previousTab(tabNumber) {
    checkNavigationStatus ();
    
    if (document.getElementById("tab-step" + (tabNumber - 1)).classList.contains("nav-disabled")) {
        return;
    }
    
    const currentTab = document.getElementById("step" + tabNumber);
    const previousTab = document.getElementById("step" + (tabNumber - 1));
    const currentTabNavBar = document.getElementById("tab-step" + tabNumber);
    const previousTabNavBar = document.getElementById("tab-step" + (tabNumber - 1));
    
    currentTab.classList.add("hide-element");
    previousTab.classList.remove("hide-element");
    currentTabNavBar.classList.remove("active");
    previousTabNavBar.classList.add("active");
}

/*
    When clicking one of the navigation button this function will run
    It first checks if the tab should be active based on the status of the input fields
*/
function goToTab(tabNumber) {
    checkNavigationStatus ();
    
    if (document.getElementById("tab-step" + tabNumber).classList.contains("nav-disabled")) {
        return;
    }
    
    const selectedTab = document.getElementById("step" + tabNumber);
    const selectedTabNavBar = document.getElementById("tab-step" + tabNumber);
    const tabElementByClass = document.getElementsByClassName("content-nav-block");
    const navElementByClass = document.getElementsByClassName("nav-link");
    
    for (let tabIndex = 0; tabIndex < tabElementByClass.length; tabIndex++) {
        const selectedItem = tabElementByClass[tabIndex]; 
        selectedItem.classList.add("hide-element");
    }
    
    for (let navIndex = 0; navIndex < navElementByClass.length; navIndex++) {
        const selectedItem = navElementByClass[navIndex];
        selectedItem.classList.remove("active");
    }
    
    selectedTab.classList.remove("hide-element");
    selectedTabNavBar.classList.add("active");
}

/*
    Updates the progress bar based on the status of the input fields
*/
function calculateProgress(tabNumber) {
    const navProgressBar = document.getElementById("navProgressBar");
    
    navProgressBar.style.width = (100 / totalNavigationSteps) * (tabNumber) + "%";
}

/*
    Count Navigation steps
*/
function countNavigationSteps() {
    const navElementByClass = document.getElementsByClassName("nav-link");
    const navProgressBar = document.getElementById("navProgressBar");
    const navLinkBar = document.getElementById("navLinkBar");
    
    totalNavigationSteps = navElementByClass.length;
    navProgressBar.style.left = (100 / totalNavigationSteps) / 2 + "%";
    navLinkBar.style.width = (100 / totalNavigationSteps) * (totalNavigationSteps - 1) + "%";
}

/*
    Check step availability
*/
function checkNavigationStatus () {
    if (disableNavCheck === true) {
        return;
    }
    
    disableAllNavigation();
    calculateProgress(0);
    let tabIndex = 1;
    
    for (let navStep in disabledNav) {
        let formInput = disabledNav[navStep].formInput;
        let htmlElements = disabledNav[navStep].htmlElements;
        
        for (let selectedKey in formInput) {
            if (formInput[selectedKey] === false) {
                return;
            }
        }
        
        for (let selectedElement in htmlElements) {
            document.getElementById(htmlElements[selectedElement]).classList.remove("nav-disabled");
        }
        
        calculateProgress(tabIndex);
        tabIndex ++;
    }
}

/*
    Disable all of the navigation until it is rechecked
*/
function disableAllNavigation(confirmation) {
    for (let navStep in disabledNav) {
        let htmlElements = disabledNav[navStep].htmlElements;
        
        for (let selectedElement in htmlElements) {
            document.getElementById(htmlElements[selectedElement]).classList.add("nav-disabled");
        }
    }
    
    if (confirmation) {
        document.getElementById("tab-step1").classList.add("nav-disabled");
        disableNavCheck = true;
    }
}

/*
    Update the navigation status object and update the UI accordingly
*/
function updateNavigationStatus(step, key, status) {
    disabledNav[step].formInput[key] = status;
    
    checkNavigationStatus ();
}

/************************************************************************************************************************************************************************/

/*
    Download and delete options
*/
    
/*
    Download error numbers
*/
function downloadErrorNumbers(downloadElementID) {
    const downloadCSV = document.getElementById(downloadElementID);
    
    downloadCSV.click();
}

function deleteDuplicates() {
    
}

function deleteErrorNumbers(htmlElement) {
    let numberTextArea = document.getElementById("phoneNumberInput");
    let numbersToDelete;
    
    switch (htmlElement) {
        case "duplicateNumbers":
            numbersToDelete = duplicateNumbersArray;
            
            break;
        case "invalidNumbers":
            numbersToDelete = invalidNumbers;
            
            break;
        default:
            return;
    }
    
    for (let index in numbersToDelete) {
        let indexToSplice = numbersToSendSMS.indexOf(numbersToDelete[index]);
        
        numbersToSendSMS.splice(indexToSplice, 1);
    }
    
    numbersToSendSMS = numbersToSendSMS.concat(unableToSanitise);
    numberTextArea.value = numbersToSendSMS.join("\n");
    
    phoneNumberInputChange();
    document.getElementById(htmlElement).classList.add("hide-element");
}

function deleteMissingCountryCode(htmlElement) {
    let numberTextArea = document.getElementById("phoneNumberInput");
    numberTextArea.value = numbersToSendSMS.join("\n");
    
    phoneNumberInputChange();
    document.getElementById(htmlElement).classList.add("hide-element");
}
