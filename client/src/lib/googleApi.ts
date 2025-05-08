import { gapi } from 'gapi-script';

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
export const initGoogleApi = (token?: string | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Initializing Google API with token:', token ? 'Token exists' : 'No token');
    
    // Check if gapi is available
    if (typeof gapi === 'undefined' || !gapi) {
      console.error('Google API client not loaded - gapi is undefined');
      reject(new Error('Google API client not loaded'));
      return;
    }
    
    // First check if token exists
    if (!token) {
      console.error('No OAuth token provided for Google API initialization');
      reject(new Error('No OAuth token provided'));
      return;
    }
    
    console.log('Loading gapi client...');
    
    // Load the client library
    gapi.load('client', async () => {
      try {
        console.log('Initializing gapi client with discovery docs...');
        
        // Initialize the client without auth first
        await gapi.client.init({
          discoveryDocs: DISCOVERY_DOCS,
        });
        
        console.log('Setting access token...');
        
        // Set the token in the client
        gapi.client.setToken({ access_token: token });
        
        // Verify API availability by checking client objects
        const hasGmail = Boolean(gapi.client.gmail);
        const hasCalendar = Boolean(gapi.client.calendar);
        const hasPeople = Boolean(gapi.client.people);
        
        console.log('Google API services available:', { 
          gmail: hasGmail, 
          calendar: hasCalendar, 
          people: hasPeople 
        });
        
        if (!hasGmail && !hasCalendar && !hasPeople) {
          console.warn('None of the required Google API services are available');
        }
        
        console.log('Google API client initialized successfully');
        resolve();
      } catch (error) {
        console.error('Error initializing Google API client:', error);
        reject(error);
      }
    });
  });
};

/**
 * Get a list of Gmail messages (most recent first)
 */
export const getGmailMessages = async (maxResults = 15, pageToken?: string) => {
  try {
    // Check if API is initialized
    if (!gapi) {
      console.error('Gmail API not initialized - gapi is undefined');
      throw new Error('Gmail API not initialized');
    }
    
    if (!gapi.client) {
      console.error('Gmail API not initialized - gapi.client is undefined');
      throw new Error('Gmail API client not initialized');
    }
    
    if (!gapi.client.gmail) {
      console.error('Gmail API not initialized - gapi.client.gmail is undefined');
      
      // Check what services are available
      const availableServices = Object.keys(gapi.client).filter(key => 
        typeof gapi.client[key] === 'object' && gapi.client[key] !== null
      );
      
      console.error('Available API services:', availableServices);
      throw new Error('Gmail API service not available');
    }
    
    console.log('Fetching Gmail messages list...');
    
    // Request list of messages
    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
    });
    
    // Log response status
    console.log('Gmail messages list response status:', response.status);
    
    if (!response.result) {
      console.error('No result in Gmail API response');
      return { messages: [], nextPageToken: undefined };
    }
    
    if (!response.result.messages || response.result.messages.length === 0) {
      console.log('No Gmail messages found');
      return { messages: [], nextPageToken: undefined };
    }
    
    console.log(`Found ${response.result.messages.length} Gmail messages`);
    
    // Fetch message details for each message ID
    const messagePromises = response.result.messages.map((message: any) => {
      console.log(`Fetching details for message ${message.id}...`);
      return gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      });
    });

    try {
      const messageDetails = await Promise.all(messagePromises);
      console.log(`Successfully fetched details for ${messageDetails.length} messages`);
      
      return {
        messages: messageDetails.map((msg: any) => {
          const { id, threadId, labelIds, payload } = msg.result;
          
          if (!payload || !payload.headers) {
            console.warn(`Message ${id} has no payload or headers`);
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
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
          const from = headers.find((h: any) => h.name === 'From')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          
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
    } catch (detailsError: any) {
      console.error('Error fetching message details:', detailsError);
      throw new Error(`Failed to fetch message details: ${detailsError.message}`);
    }
  } catch (error: any) {
    console.error('Error fetching Gmail messages:', error);
    
    // Provide more detailed error messages based on error type
    if (error.status === 401) {
      throw new Error('Authentication required to access Gmail. Please log out and log in again.');
    } else if (error.status === 403) {
      throw new Error('Permission denied to access Gmail. Make sure to grant appropriate permissions.');
    } else if (error.status === 404) {
      throw new Error('Gmail API service not found. This might be a configuration issue.');
    } else if (error.result && error.result.error) {
      // Extract the detailed error message from the Google API response
      throw new Error(`Gmail API error: ${error.result.error.message}`);
    }
    
    // Generic error with the original error message
    throw error;
  }
};

/**
 * Get calendar events for a specified date range
 */
export const getCalendarEvents = async (timeMin: string, timeMax: string) => {
  try {
    // Check if API is initialized
    if (!gapi || !gapi.client || !gapi.client.calendar) {
      console.error('Calendar API not initialized');
      throw new Error('Calendar API not initialized');
    }
    
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.result.items || [];
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    // If it's an auth error, provide a more specific message
    if (error.status === 401) {
      throw new Error('Authentication required to access Calendar');
    }
    throw error;
  }
};

/**
 * Generate start and end dates for a given month view
 */
export const getMonthDateRange = (year: number, month: number) => {
  // Month is 0-indexed in JavaScript Date (0 = January, 11 = December)
  const timeMin = new Date(year, month, 1, 0, 0, 0).toISOString();
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  
  return { timeMin, timeMax };
};

/**
 * Get user's contacts
 */
export const getContacts = async (pageSize = 50, pageToken?: string) => {
  try {
    // Check if API is initialized
    if (!gapi || !gapi.client || !gapi.client.people) {
      console.error('Contacts API not initialized');
      throw new Error('Contacts API not initialized');
    }
    
    const response = await gapi.client.people.people.connections.list({
      resourceName: 'people/me',
      pageSize,
      pageToken,
      personFields: 'names,emailAddresses,phoneNumbers',
    });
    
    return {
      contacts: response.result.connections || [],
      nextPageToken: response.result.nextPageToken,
    };
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    // If it's an auth error, provide a more specific message
    if (error.status === 401) {
      throw new Error('Authentication required to access Contacts');
    }
    throw error;
  }
};

/**
 * Send an email reply
 */
export const sendEmailReply = async (threadId: string, to: string, subject: string, body: string) => {
  try {
    // Check if API is initialized
    if (!gapi || !gapi.client || !gapi.client.gmail) {
      console.error('Gmail API not initialized');
      throw new Error('Gmail API not initialized');
    }
    
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
    const encodedEmail = btoa(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send the email
    const response = await gapi.client.gmail.users.messages.send({
      userId: 'me',
      threadId,
      resource: {
        raw: encodedEmail,
        threadId
      }
    });
    
    return response.result;
  } catch (error: any) {
    console.error('Error sending email reply:', error);
    // If it's an auth error, provide a more specific message
    if (error.status === 401) {
      throw new Error('Authentication required to send emails');
    }
    throw error;
  }
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (summary: string, description: string, start: Date, end: Date, location?: string) => {
  try {
    // Check if API is initialized
    if (!gapi || !gapi.client || !gapi.client.calendar) {
      console.error('Calendar API not initialized');
      throw new Error('Calendar API not initialized');
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
    
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event
    });
    
    return response.result;
  } catch (error: any) {
    console.error('Error creating calendar event:', error);
    // If it's an auth error, provide a more specific message
    if (error.status === 401) {
      throw new Error('Authentication required to create calendar events');
    }
    throw error;
  }
};

/**
 * Create a new contact
 */
export const createContact = async (name: string, email?: string, phone?: string) => {
  try {
    // Check if API is initialized
    if (!gapi || !gapi.client || !gapi.client.people) {
      console.error('Contacts API not initialized');
      throw new Error('Contacts API not initialized');
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
    
    const response = await gapi.client.people.people.createContact({
      resource: contactResource
    });
    
    return response.result;
  } catch (error: any) {
    console.error('Error creating contact:', error);
    // If it's an auth error, provide a more specific message
    if (error.status === 401) {
      throw new Error('Authentication required to create contacts');
    }
    throw error;
  }
};