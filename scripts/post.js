/*
    Populate the data object and return a stringified version
*/
function populateData(postDetails, index) {
    let dataObject = {
        "to": postDetails.numberArray[index],
        "text": postDetails.smsMessage
    };

    const alphanumbericCheck = document.getElementById("alphanumericCheck");

    if (alphanumbericCheck.checked) {
        dataObject.from = postDetails.alphaNumbericName;
        dataObject.messaging_profile_id = postDetails.messagingProfile;
    } else {
        dataObject.from = postDetails.telnyxNumber;
    }

    return JSON.stringify(dataObject);
}

/* 
    This version of the send message function will send them as quickly as possible.
    There is a chance the API may get overwhelmed if too many messages are sent.

    This is faster.
*/
function sendSMSAsync(postDetails, numberArrayLength) {
    document.getElementById("confirmationSendingIcon").classList.remove("hide-element");
    document.getElementById("confirmationSentIcon").classList.add("hide-element");
    document.getElementById("confirmationFatalIcon").classList.add("hide-element");
    
    for (let index = 0; index < numberArrayLength; index++) {
        if (emergencyStop === true) {
            break;
        }

        const data = populateData(postDetails, index);
        let xhr = new XMLHttpRequest();

        xhr.open("POST", apiURL.message);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Authorization", "Bearer " + postDetails.apiKey);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.send(data);

        xhr.onload = function () {
            if (xhr.status === 200) {
                successTotal++;
                
                if (successTotal === 1) {
                    document.getElementById("confirmationSuccessNumber").innerHTML = String(successTotal) + " message sent of " + String(numberArrayLength);
                } else {
                    document.getElementById("confirmationSuccessNumber").innerHTML = String(successTotal) + " messages sent of " + String(numberArrayLength);
                }
                
                sendSuccess(xhr.response);
            } else {
                handleErrorMessage(xhr.response, xhr.status, numberArrayLength);
                
                if (emergencyStop === true) {
                    fatalErrorDetected();
                    
                    return;
                }
                
                errorTotal++;
                
                if (errorTotal === 1) {
                    document.getElementById("confirmationErrorNumber").innerHTML = "<b>" + String(errorTotal) + "</b> message failed to send";
                } else {
                    document.getElementById("confirmationErrorNumber").innerHTML = "<b>" + String(errorTotal) + "</b> messages failed to send";
                }
            }

            if (numberArrayLength === (successTotal + errorTotal)) {
                displayComplete();
            }
        };
    }
}

/*
    Get the current account info from the API key used
*/
function getAccountInfo() {
    document.getElementById("accountBalance").innerHTML = "";

    const apiKey = document.getElementById("apiKey").value;

    let xhr = new XMLHttpRequest();

    xhr.open("GET", apiURL.balance);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + apiKey);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send();

    xhr.onload = function () {
        const sanitisedResponse = JSON.parse(xhr.response);

        if (xhr.status === 200) {
            updateNavigationStatus("step1", "api", true);
            accountBalance = parseFloat(sanitisedResponse.data.balance);
            document.getElementById("accountBalance").innerHTML = "<b>Current balance</b>: " + sanitisedResponse.data.balance + " " + sanitisedResponse.data.currency;
            document.getElementById("apiKey").classList.remove("form__section-error");
            currencyCode = sanitisedResponse.data.currency;
            startPhoneNumberCheck();
        } else {
            updateNavigationStatus("step1", "api", false);
            document.getElementById("apiKey").classList.add("form__section-error");
            document.getElementById("accountBalance").innerHTML = "";
        }
    };
}
