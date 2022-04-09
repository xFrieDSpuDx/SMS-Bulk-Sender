# SMS-Bulk-Sender
SMS message bulk sender using the Telnyx API</br></br>

Use the Telnyx API to bulk send SMS services. This project does initial checks of the numbers. It calculates how many SMS' the input text will be split into to help estimate send costs. There is the option to send the message with an alphanumeric title instead of the number. This will require a Telnyx messaging profile being created and the unique ID being used.</br>
The messages are sent as quickly as the browser can send post requests.</br>
To try this out before self hosting use https://sms.lily-pad.uk where this code is hosted.</br></br>

* Ensure your Telnyx account has been verified so the account isn't disabled when sending large numbers of messages.</br></br>

Install:</br>
Configure a webserver and copy the contents of this repository into the directory.</br></br>

Latest Commit Functionality:</br>
Fixed the asynchronous send function to dramatically improve message send performance. The website will now send messages as quickly as the browser can send post requests. The interface will stay locked out until all post requests have had a response of any type.</br></br>
TODO:</br>
More comprehensive error handling</br>
Enable store details in cookies</br>
Enable resume sending if the page is closed before all numbers are messaged
