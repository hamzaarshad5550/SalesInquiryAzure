"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContact = exports.deleteCalendarEvent = exports.updateCalendarEvent = exports.createCalendarEvent = exports.sendEmailReply = exports.getContacts = exports.getMonthDateRange = exports.getCalendarEvents = exports.getGmailMessageDetail = exports.getGmailMessages = exports.initGoogleApi = void 0;
const gapi_script_1 = require("gapi-script");
// API Discovery URLs
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/people/v1/rest',
];
// Authorization scopes
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/contacts'
].join(' ');
/**
 * Initialize the Google API client
 * @param token OAuth token to use for authorization
 */
// Keep track of initialization state to avoid redundant calls
let isInitializing = false;
let isInitialized = false;
let initializationPromise = null;
const initGoogleApi = (token) => {
    // If already initialized, return immediately
    if (isInitialized && token) {
        return Promise.resolve();
    }
    // If initialization is in progress, return the existing promise
    if (isInitializing && initializationPromise) {
        return initializationPromise;
    }
    // Start new initialization
    isInitializing = true;
    initializationPromise = new Promise((resolve, reject) => {
        // Check if gapi is available
        if (typeof gapi_script_1.gapi === 'undefined' || !gapi_script_1.gapi) {
            isInitializing = false;
            reject(new Error('Google API client not loaded'));
            return;
        }
        // First check if token exists
        if (!token) {
            isInitializing = false;
            reject(new Error('No OAuth token provided'));
            return;
        }
        // Load the client library
        gapi_script_1.gapi.load('client', async () => {
            try {
                // Initialize the client without auth first
                await gapi_script_1.gapi.client.init({
                    discoveryDocs: DISCOVERY_DOCS,
                });
                // Set the token in the client
                gapi_script_1.gapi.client.setToken({ access_token: token });
                // Mark as initialized
                isInitialized = true;
                isInitializing = false;
                resolve();
            }
            catch (error) {
                console.error('Error initializing Google API client:', error);
                isInitializing = false;
                reject(error);
            }
        });
    });
    return initializationPromise;
};
exports.initGoogleApi = initGoogleApi;
/**
 * Get a list of Gmail messages (most recent first)
 */
const getGmailMessages = async (maxResults = 15, pageToken) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.gmail) {
            throw new Error('Gmail API service not available');
        }
        // Request list of messages
        const response = await gapi_script_1.gapi.client.gmail.users.messages.list({
            userId: 'me',
            maxResults,
            pageToken,
        });
        if (!response.result) {
            return { messages: [], nextPageToken: undefined };
        }
        if (!response.result.messages || response.result.messages.length === 0) {
            return { messages: [], nextPageToken: undefined };
        }
        // Fetch message details for each message ID
        const messagePromises = response.result.messages.map((message) => gapi_script_1.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date'],
        }));
        try {
            const messageDetails = await Promise.all(messagePromises);
            return {
                messages: messageDetails.map((msg) => {
                    const { id, threadId, labelIds, payload } = msg.result;
                    if (!payload || !payload.headers) {
                        return {
                            id,
                            threadId,
                            labelIds,
                            subject: '(No Subject)',
                            from: '',
                            date: '',
                        };
                    }
                    const headers = payload.headers || [];
                    // Extract relevant headers
                    const subject = headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
                    const from = headers.find((h) => h.name === 'From')?.value || '';
                    const date = headers.find((h) => h.name === 'Date')?.value || '';
                    return {
                        id,
                        threadId,
                        labelIds,
                        subject,
                        from,
                        date,
                    };
                }),
                nextPageToken: response.result.nextPageToken,
            };
        }
        catch (detailsError) {
            throw new Error(`Failed to fetch message details: ${detailsError.message}`);
        }
    }
    catch (error) {
        console.error('Error fetching Gmail messages:', error);
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to access Gmail. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to access Gmail. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('Gmail API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Gmail API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.getGmailMessages = getGmailMessages;
/**
 * Get detailed information for a specific Gmail message
 */
const getGmailMessageDetail = async (messageId) => {
    try {
        // Check if Gmail API is available
        if (!gapi_script_1.gapi?.client?.gmail) {
            throw new Error('Gmail API service not available');
        }
        // Get the full message details
        const response = await gapi_script_1.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        });
        if (!response.result) {
            throw new Error('Failed to retrieve message details');
        }
        const message = response.result;
        // Extract headers
        const headers = message.payload.headers;
        const subject = headers.find((h) => h.name === 'Subject')?.value || '';
        const from = headers.find((h) => h.name === 'From')?.value || '';
        const to = headers.find((h) => h.name === 'To')?.value || '';
        const date = headers.find((h) => h.name === 'Date')?.value || '';
        // Extract body content
        let body = '';
        // Function to extract body from parts recursively
        const extractBody = (part) => {
            if (part.body.data) {
                // Base64 decode the body data
                const decodedBody = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                if (part.mimeType === 'text/html') {
                    body = decodedBody;
                    return true;
                }
                else if (part.mimeType === 'text/plain' && !body) {
                    body = `<pre>${decodedBody}</pre>`;
                    return false; // Continue looking for HTML
                }
            }
            if (part.parts) {
                for (const subPart of part.parts) {
                    if (extractBody(subPart)) {
                        return true;
                    }
                }
            }
            return false;
        };
        // Try to extract body from the message payload
        if (message.payload.body && message.payload.body.data) {
            const decodedBody = atob(message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            if (message.payload.mimeType === 'text/html') {
                body = decodedBody;
            }
            else {
                body = `<pre>${decodedBody}</pre>`;
            }
        }
        else if (message.payload.parts) {
            extractBody(message.payload);
        }
        return {
            id: message.id,
            threadId: message.threadId,
            subject,
            from,
            to,
            date,
            body
        };
    }
    catch (error) {
        console.error('Error fetching email details:', error);
        // Provide more detailed error messages
        if (error.status === 401) {
            throw new Error('Authentication required to access email details. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to access email details. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('Email not found. It may have been deleted or moved.');
        }
        else if (error.result && error.result.error) {
            throw new Error(`Gmail API error: ${error.result.error.message}`);
        }
        throw new Error('Failed to load email details. Please try again later.');
    }
};
exports.getGmailMessageDetail = getGmailMessageDetail;
/**
 * Get calendar events for a specified date range
 */
const getCalendarEvents = async (timeMin, timeMax) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.calendar) {
            throw new Error('Calendar API service not available');
        }
        const response = await gapi_script_1.gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return response.result.items || [];
    }
    catch (error) {
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to access Calendar. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to access Calendar. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('Calendar API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Calendar API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.getCalendarEvents = getCalendarEvents;
/**
 * Generate start and end dates for a given month view
 */
const getMonthDateRange = (year, month) => {
    // Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
    const timeMin = new Date(year, month, 1, 0, 0, 0).toISOString();
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    return { timeMin, timeMax };
};
exports.getMonthDateRange = getMonthDateRange;
/**
 * Get user's contacts
 */
const getContacts = async (pageSize = 50, pageToken) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.people) {
            throw new Error('People API service not available');
        }
        const response = await gapi_script_1.gapi.client.people.people.connections.list({
            resourceName: 'people/me',
            pageSize,
            pageToken,
            personFields: 'names,emailAddresses,phoneNumbers',
        });
        return {
            contacts: response.result.connections || [],
            nextPageToken: response.result.nextPageToken,
        };
    }
    catch (error) {
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to access Contacts. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to access Contacts. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('People API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Contacts API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.getContacts = getContacts;
/**
 * Send an email reply
 */
const sendEmailReply = async (threadId, to, subject, body) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.gmail) {
            throw new Error('Gmail API service not available');
        }
        console.log('Sending email reply:', { threadId, to, subject });
        // Create the email content
        const emailContent = [
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            body
        ].join('\r\n');
        // Encode the email to base64url format
        const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        // Send the email
        const response = await gapi_script_1.gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: encodedEmail,
                threadId
            }
        });
        console.log('Email reply sent successfully:', response.result);
        return response.result;
    }
    catch (error) {
        console.error('Error sending email reply:', error);
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to send emails. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to send emails. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('Gmail API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Gmail API error: ${error.result.error.message}`);
        }
        else if (error.message) {
            throw new Error(`Failed to send email: ${error.message}`);
        }
        // Generic error with the original error message
        throw new Error('Failed to send email. Please try again later.');
    }
};
exports.sendEmailReply = sendEmailReply;
/**
 * Create a new calendar event
 */
const createCalendarEvent = async (summary, description, start, end, location) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.calendar) {
            throw new Error('Calendar API service not available');
        }
        const event = {
            summary,
            description,
            location,
            start: {
                dateTime: start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        const response = await gapi_script_1.gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });
        return response.result;
    }
    catch (error) {
        console.error('Error creating calendar event:', error);
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to create calendar events. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to create calendar events. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('Calendar API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Calendar API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.createCalendarEvent = createCalendarEvent;
/**
 * Update an existing calendar event
 */
const updateCalendarEvent = async (eventId, summary, description, start, end, location) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.calendar) {
            throw new Error('Calendar API service not available');
        }
        const event = {
            summary,
            description,
            location,
            start: {
                dateTime: start.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: end.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        const response = await gapi_script_1.gapi.client.calendar.events.update({
            calendarId: 'primary',
            eventId: eventId,
            resource: event
        });
        return response.result;
    }
    catch (error) {
        console.error('Error updating calendar event:', error);
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to update calendar events. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to update calendar events. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('Calendar event or API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Calendar API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.updateCalendarEvent = updateCalendarEvent;
/**
 * Delete a calendar event
 */
const deleteCalendarEvent = async (eventId) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.calendar) {
            throw new Error('Calendar API service not available');
        }
        const response = await gapi_script_1.gapi.client.calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId
        });
        return response.result;
    }
    catch (error) {
        console.error('Error deleting calendar event:', error);
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to delete calendar events. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to delete calendar events. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            // If the event is not found, consider it already deleted
            return true;
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Calendar API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.deleteCalendarEvent = deleteCalendarEvent;
/**
 * Create a new contact
 */
const createContact = async (name, email, phone) => {
    try {
        // Simplified API check - only check the final required service
        if (!gapi_script_1.gapi?.client?.people) {
            throw new Error('People API service not available');
        }
        const contactResource = {
            names: [
                {
                    givenName: name.split(' ')[0] || '',
                    familyName: name.split(' ').slice(1).join(' ') || '',
                    displayName: name
                }
            ],
            emailAddresses: email ? [
                {
                    value: email,
                    type: 'work'
                }
            ] : undefined,
            phoneNumbers: phone ? [
                {
                    value: phone,
                    type: 'mobile'
                }
            ] : undefined
        };
        const response = await gapi_script_1.gapi.client.people.people.createContact({
            resource: contactResource
        });
        return response.result;
    }
    catch (error) {
        console.error('Error creating contact:', error);
        // Provide more detailed error messages based on error type
        if (error.status === 401) {
            throw new Error('Authentication required to create contacts. Please log out and log in again.');
        }
        else if (error.status === 403) {
            throw new Error('Permission denied to create contacts. Make sure to grant appropriate permissions.');
        }
        else if (error.status === 404) {
            throw new Error('People API service not found. This might be a configuration issue.');
        }
        else if (error.result && error.result.error) {
            // Extract the detailed error message from the Google API response
            throw new Error(`Contacts API error: ${error.result.error.message}`);
        }
        // Generic error with the original error message
        throw error;
    }
};
exports.createContact = createContact;
