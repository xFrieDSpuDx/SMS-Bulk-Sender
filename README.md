# SMS-Bulk-Sender
SMS message bulk sender using the Telnyx API</br></br>

Use the Telnyx API to bulk send SMS services. This project does initial checks of the numbers. It calculates how many SMS' the input text will be split into to help estimate send costs. There is the option to send the message with an alphanumeric title instead of the number. This will require a Telnyx messaging profile being created and the unique ID being used.</br>
The messages are sent as quickly as the browser can send post requests.</br>
To try this out before self hosting use https://sms.lily-pad.uk where this code is hosted.</br></br>

* Ensure your Telnyx account has been verified so the account isn't disabled when sending large numbers of messages.</br>
* Telnyx has rate limiters on certain number formats. UK long numbers for example are 6 messages a minute by default. Once the SMS Bulk Sender has successfully sent the messages from Telnyx, there may be a delay in the message being delivered while these rate limits are in place. Please speak with Telynix to have this limit removed.<br/></br>

Install:</br>
Configure a webserver and copy the contents of this repository into the directory.</br></br>

Latest Commit Functionality:</br>
A huge update to the user interface, error handling and overall functionality.</br>
The application now uses a tab step system where you can only move on to the next section once the current page is complete and valid.</br>
The user interface offers a lot more support for what is needed in each section, prompting the user with suggestions and information on one side and colour feedback for form input status.</br></br>

The error handling has been improved, the send to number is now verified and works with all countries that Telnyx supports.</br>
The invalid phone numbers are displayed in a more user friendly way, giving the option to download them all as CSV or simply deleting them from the input field. These errors are split into three different categories:</br>
Invalid Numbers</br>
Missing country code</br>
Duplicates</br></br>

The system will try to send to the numbers it detects as invalid so long as there is a single valid number in the list.</br></br>

There is now a confirmation page showing useful information about what was sent and gives the option to download a summary of which numbers sent correctly, which failed and what the message was.</br>
The confirmation page also shows much more useful error messages to help diagnose exactly what went wrong if a fatal error is encountered.</br></br>
TODO:</br>
Add functionality to allow for variables in the text message.</br>
<del>Functionality would be driven from a CSV file used to populate the numbers, the format should be</br></br></dev>

<del>Number, Variable 1 Text, Variable 2 text....</br></br></del>

<del>E.g. +447123456789, John, john@email.com</del>

<del>The message would be written as follows: </br></br></del>

<del>Hi {column1}!</br></del>
<del>To help us keep our records up to date please can you confirm your current email address is {column2}?</br></del>
<del>Have a great day!</br></br></del>

<del>This would display to John as:</del>

<del>Hi John!</br></del>
<del>To help us keep our records up to date please can you confirm your current email address is john@email.com?</br></del>
<del>Have a great day!</br></br></del>
