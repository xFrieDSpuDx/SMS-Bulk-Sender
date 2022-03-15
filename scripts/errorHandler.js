/*
    A switch case of different error messages to help the user narrow down 
    what went wrong
*/
function handleErrorMessage(response, status, numberArrayLength) {
    const sanitisedResponse = JSON.parse(response);

    switch (status) {
        case 401:
            emergencyStop = true;
            document.getElementById("sendErrors").innerHTML = "Error: Authentication failed. Please check your API key.";
            break;
        case 422:
            emergencyStop = true;
            document.getElementById("sendErrors").innerHTML = "Error: No message found. Please type a message and try again.";
            break;
        case 400:
            if (numberArrayLength - 1 === 0) {
                document.getElementById("sendErrors").innerHTML = "Error: Invalid phone number. Please check your Telnyx number and the send to number, then try again";
            }
            break;
        default:
            document.getElementById("sendErrors").innerHTML = sanitisedResponse.errors.title;
    }
}

/*
    Build the error list and display the numbers with errors
*/
function populateFinalErrorMessage(difference, htmlElement) {
    if (difference.length === 0) {
        return;
    }

    let displayErrorArray = difference.join(", ");

    document.getElementById(htmlElement).innerHTML += ": " + displayErrorArray;
}