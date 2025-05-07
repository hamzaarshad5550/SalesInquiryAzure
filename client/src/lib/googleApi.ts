import { gapi } from 'gapi-script';

// Google API Client ID
const CLIENT_ID = '137346993798-vjsp4l8dlv3klnbke2gedbfj1a4v0ild.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDWQixjQMi_LQ3TiKqI1PyEnrMqt699cQo';

// API Discovery URLs
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
];

// Authorization scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/**
 * Initialize the Google API client
 */
export const initGoogleApi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        });
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
    }
    
    return { messages: [], nextPageToken: undefined };
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
};

/**
 * Get calendar events for a specified date range
 */
export const getCalendarEvents = async (timeMin: string, timeMax: string) => {
  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.result.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
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