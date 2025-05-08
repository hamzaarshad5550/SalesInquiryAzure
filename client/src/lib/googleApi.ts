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
    // Check if gapi is available
    if (!gapi) {
      console.error('Google API client not loaded');
      reject(new Error('Google API client not loaded'));
      return;
    }
    
    // First check if token exists
    if (!token) {
      console.error('No OAuth token provided for Google API initialization');
      reject(new Error('No OAuth token provided'));
      return;
    }
    
    gapi.load('client', async () => {
      try {
        // Initialize the client without auth first
        await gapi.client.init({
          discoveryDocs: DISCOVERY_DOCS,
        });
        
        // Set the token in the client
        gapi.client.setToken({ access_token: token });
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
    if (!gapi || !gapi.client || !gapi.client.gmail) {
      console.error('Gmail API not initialized');
      throw new Error('Gmail API not initialized');
    }
    
    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
    });

    if (response.result.messages && response.result.messages.length > 0) {
      // Fetch message details for each message ID
      const messagePromises = response.result.messages.map((message: any) =>
        gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Date'],
        })
      );

      const messageDetails = await Promise.all(messagePromises);
      
      return {
        messages: messageDetails.map((msg: any) => {
          const { id, threadId, labelIds, payload } = msg.result;
          const headers = payload?.headers || [];
          
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
    }
    
    return { messages: [], nextPageToken: undefined };
  } catch (error: any) {
    console.error('Error fetching Gmail messages:', error);
    // If it's an auth error, provide a more specific message
    if (error.status === 401) {
      throw new Error('Authentication required to access Gmail');
    }
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
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

/**
 * Send an email reply
 */
export const sendEmailReply = async (threadId: string, to: string, subject: string, body: string) => {
  try {
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
  } catch (error) {
    console.error('Error sending email reply:', error);
    throw error;
  }
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (summary: string, description: string, start: Date, end: Date, location?: string) => {
  try {
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
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Create a new contact
 */
export const createContact = async (name: string, email?: string, phone?: string) => {
  try {
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
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};