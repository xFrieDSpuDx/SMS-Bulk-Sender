/*
    A switch case of different error messages to help the user narrow down 
    what went wrong
*/
function handleErrorMessage(response, status, numberArrayLength) {
    const sanitisedResponse = JSON.parse(response);

    switch (status) {
        case 401:
            emergencyStop = true;
            document.getElementById("confirmationSendingStatus").innerHTML = "Error: Authentication failed. Please check your API key.";
            
            break;
        case 422:
            emergencyStop = true;
            document.getElementById("confirmationSendingStatus").innerHTML = "Error: No message found. Please type a message and try again.";
            
            break;
        case 400:
            const errorCode = sanitisedResponse.errors[0].code;
            const errorTitle = sanitisedResponse.errors[0].title;
            const errorDetails = sanitisedResponse.errors[0].detail;
            
            if (errorCode === "10004") {
                emergencyStop = true;
                document.getElementById("confirmationSendingStatus").innerHTML = "Error: " + errorTitle + "<br/>Details: " + errorDetails;
            }
            
            break;
    }
}

/*
    Build the error list and display the numbers with errors
*/
function populateNumberErrors(errorArray, htmlElement) {
    const errorsFound = errorArray.length;
    if (errorsFound === 0) {
        return;
    }
    
    document.getElementById(htmlElement).classList.remove("hide-element");
    
    const mainDiv = document.getElementById(htmlElement);
    const downloadElement = mainDiv.getElementsByTagName('a')[0].id;

    createCSVForDownload(errorArray, downloadElement);
    
    switch (htmlElement) {
        case "duplicateNumbers":
            if (errorsFound === 1) {
                document.getElementById("duplicateNumbersText").innerHTML = "<b>" + errorsFound + "</b> Duplicate found";
            } else {
                document.getElementById("duplicateNumbersText").innerHTML = "<b>" + errorsFound + "</b> Duplicates found";
            }
            
            break;
        case "missingCountryCodeErrors":
            if (errorsFound === 1) {
                document.getElementById("missingCountryCodeText").innerHTML = "<b>" + errorsFound + "</b> Missing country code";
            } else {
                document.getElementById("missingCountryCodeText").innerHTML = "<b>" + errorsFound + "</b> Missing country codes";
            }
            
            break;
        case "invalidNumbers":
            if (errorsFound === 1) {
                document.getElementById("sendErrorsText").innerHTML = "<b>" + errorsFound + "</b> Invalid number";
            } else {
                document.getElementById("sendErrorsText").innerHTML = "<b>" + errorsFound + "</b> Invalid numbers";
            }
            break;
    }
}

/*
    Emergency Stop update UI
*/
function fatalErrorDetected() {
    document.getElementById("confirmationSendingIcon").classList.add("hide-element");
    document.getElementById("confirmationSentIcon").classList.add("hide-element");
    document.getElementById("confirmationFatalIcon").classList.remove("hide-element");
    
    document.getElementById("confirmationSending").innerHTML = "Fatal error detected. Sending Stopped.";
    document.getElementById("confirmationSuccessNumber").classList.add("hide-element");
    document.getElementById("confirmationErrorNumber").classList.add("hide-element");
    document.getElementById("confirmationCosts").classList.add("hide-element");
    document.getElementById("confirmationNewBalance").classList.add("hide-element");
}