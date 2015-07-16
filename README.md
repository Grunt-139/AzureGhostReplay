#Azure Ghost Replay

##Table of Contents
1. [What is Ghost Replay](#what-is-ghost-replay)
2. [Why Azure Storage](#why-azure-storage)
3. [Setting it All Up](#setting-it-all-up)
  1. [What's Needed](#whats-needed)
  2. [Setting it Up](#setting-it-up)
4. [Ghost Replay In Action](#ghost-replay-in-action)
  1. [Initialization](#initialization)
  2. [Session Functions](#session-functions)
  3. [Write Functions](#write-functions)
  4. [Read Functions](#read-functions)
  5. [Utility Functions](#utility-functions)
  6. [Expanding](#expansion)


## What is Ghost Replay?

'Ghost Replay' is a term used to describe a game system that shows the player's progress, with the player being 'ghosted' out.
Commonly found in racing games, where the player races a track and then has to beat their 'ghost'. They replay the level, with a ghosted out version of themselves racing as well.

## Why Azure Storage?

The issue with this sort of system is that it could involve storing large amounts of data. Which often is not an option.
Azure Storage offers a managed, easily scaled, and fast storage option to store this sort of data. 

## Setting it All Up
This implementation of a Ghost Replay system will use Azure Storage to store and later read the data back.
Specifically, a NodeJS server running on an Azure Website (or other site)
This Azure - NodeJS communication is brought to us by this fine repository, [Azure Storage Node](https://github.com/Azure/azure-storage-node)

For information or possible extensions about the backend aspect of this solution, their docs can be consulted.

For passing data back and forth, Socket.IO is used

### What's Needed
1. Azure Subscription
2. Text Editor
  - Such as Notepad++ or VSCode
3. FTP Client
  - Like Filezilla


### Setting it Up
1. [Sign up for Azure](https://azure.microsoft.com/en-us/pricing/free-trial/?WT.mc_id=azurebg_CA_sem_google_BR_BRTop_Nontest_FreeTrial_azure&WT.srch=1)
2. [Navigate to the Azure Portal](https://portal.azure.com/)
3. **Create a Storage Account**
  - From the Azure Portal navigate New->Data+Storage->Storage and fill in the blanks
  - Full [MSDN Article](https://azure.microsoft.com/en-us/documentation/articles/storage-create-storage-account/#create-a-storage-account) *Using the non-preview version of Azure Portal
4. **Create an Azure WebApp/Website to host our Server**
  - From the Azure Portal, New-> Web + Mobile -> Web App
  - Fill in the blanks
5. **Deploy Web App**
  - Azure Web App's can be deployed from popular Source Control Systems, like a Local Git Repo, Github, DropBox or Visual Studio Online
  - Not necessary but a useful feature
  - [MSDN Article](https://azure.microsoft.com/en-us/documentation/articles/web-sites-deploy/)
6. **Setup the Website**
  1. **First, setup your deployment credentials for FTP**
     - **Preview Azure Portal:** All Settings->Deployment Credentials
     
	   - **Classic Azure Portal:** From the Dashboard, click Reset your deployment credentials
  2. **Second, set Environment Variables**
     - **Preview Azure Portal:** All Settings->Application Settings->App Settings
     
	   - **Classic Azure Portal:** From the Dashboard, Configure->App Settings
	 - These Environment Variables are necessary for the NodeJS server to connect
	 - Located in [Your Storage Account]->All Settings->Keys OR [Your Storage Account] Dashboard->Manage Access Keys(except for Primary Connection String)
	     - **AZURE_STORAGE_ACCOUNT:** Storage Account Name
	     - **AZURE_STORAGE_ACCESS_KEY:** Primary Access Key
	     - **AZURE_STORAGE_CONNECTION_STRING:** Primary Connection String (if you can't find it this is the format "DefaultEndpointsProtocol=https;AccountName=STORAGE_ACCOUNT_NAME;AccountKey=PRIMARY_KEY" )
  3. **Turn on WebSockets**
     - **Preview Azure Portal:** All Settings->Application Settings->Web Sockets
     
	   - **Classic Azure Portal:** From the Dashboard, Configure->Web Sockets
7. **Setup the Server**
  - Open up a FTP Client and Connect to the Server
    - Login Credentials are found within the Azure Portal
      - **Preview:** All Settings->Properties
      
      - **Classic:** Right hand side of screen
      
      - **Host Name**: Unique for each Azure Subscription
      - **User Name**: [website name]/[username previously set]
      - **Password**: Password set when Deployment Credentials were reset
  - Navigate to **site\wwwroot**
    - Drag and drop the contents of **Server Side Code** here
    
    
## Ghost Replay in Action

### Initialization
Initialization is very straight forward

Add a reference to AzureGhostReplay.js

    
    <script src="AzureGhostReplay.js"></script>
    
    
Add reference to Socket.IO

    
    <script src="https://cdn.socket.io/socket.io-1.2.0.js"></script>
    
    
Then somewhere suitable in the game add this

    
    var azure = new AzureGhostReplay(serverURL,unique id for current user);
    
**OR**
    
    
    var azure = new AzureGhostReplay(serverUrl,"");
    

The first initializes a new Azure Ghost Replay system with a specific Id, useful if you want to keep all of a player's replays contained and saved.
The other method allows the object to assign a random uuid (Universally Unique Identifier).

Depends on the application, permanent storage or one-off storage

Next, before data can be written or read, the current session needs to be set.

Azure BLOB storage is organized in the following manner:
Storage Account -> Containers -> BLOBS (Binary Large Objects)

At this point, the Storage Account is set up. Now it needs to be populated with Containers, and blobs.

In this application, every user will be represented as a Container and their gameplay data will be stored as blobs.
Therefore, the UUID is the name of the user's container, and the 'session' is the name of the blob that is being written to/read from.


Some rules to live by when manually naming the session or the uuid

**Container Name Rules (UUID)**

- A container name must be all lowercase.
- Container names must start with a letter or number, and can contain only letters, numbers, and the dash (-) character.
- Every dash (-) character must be immediately preceded and followed by a letter or number; consecutive dashes are not permitted in container names.
- Container names must be from 3 through 63 characters long.

**Blob Name Rules (Session Name)**

- A blob name can contain any combination of characters.
- A blob name must be at least one character long and cannot be more than 1,024 characters long.
- Blob names are case-sensitive.
- Reserved URL characters must be properly escaped.
- The number of path segments comprising the blob name cannot exceed 254. A path segment is the string between consecutive delimiter characters (e.g., the forward slash '/') that corresponds to the name of a virtual directory.

Azure Storage is based on a flat storage scheme. Meaning, while you can virtually create directories, no folders are actually created.
In order to create a virtual directory, set the session to something like:
> myFolder/myblob

**Further Reading**

[MSDN Article On Using Blob Storage](https://azure.microsoft.com/en-us/documentation/articles/storage-nodejs-how-to-use-blob-storage/)

[Understanding Page Blobs vs Block Blobs](https://msdn.microsoft.com/library/azure/ee691964.aspx)

To set the current session, there are two options. Manually set it or allow a name be generated.
The name generated is based off the date, time, and uuid.
    
    
    azure.SetCurrentSession("SessionName");
    
    //OR
    
    azure.StartNewSession();
    

Now data can be written and read from Azure


## Session Functions

The following functions handle the getting, and setting of the current session.

###SetCurrentSession(sessionId)

Sets the current session

* **Parameters :**  sessionId (Name of new session)
* **Returns :**  None
* **Example:**   


		var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
		azure.SetCurrentSession("MySession");
  
  
###GetCurrentSession()

Returns the name of the current session

* **Parameters :**  None
* **Returns :**  currentSession (local variable)
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    
    azure.SetCurrentSession("MySession");
    
    var currentSession = azure.GetCurrentSession();
    
    console.log(currentSession) //MySession
    
``` 
    
###StartNewSession()

Begins a new session (sets the local currentSession variable), based on the date, time and uuid

* **Parameters :**  None
* **Returns :**  None
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.StartNewSession();
     ....Do applications

```


## Write Functions

The following functions handle writing to Azure.

Data can be written directly to a new blob (by setting the currentSession with SetCurrentSession or StartNewSession)

**OR**

Data can be written to the server, and temporarily stored and written later via the AddToBuffer and WriteFromBuffer. Allowing data to be built up and then sent off.

Currently, data cannot be added to an existing blob. This is deliberate to avoid race conditions, and over complications. 

Take great care in deciding what data is sent up, the larger the file the longer it will take to read or write. 
Evaluate your game, decide what data needs to be stored, and what can be dealt with locally.
Best way is to identify events in your game the drive logic, things like player input. Instead of storing the player's position constantly, the input can be tracked. When they move, what direction, when they jump etc.


###WriteToCurrentSession(data,callback)

Writes to the current session

* **Parameters :**  
  * Data : Data to be written to Azure
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is WRITE_BLOB
  
* **Returns :**  Server will return:
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * BlobName : Name of blob written to
  * Result: Typically returns true or false depending on if successful
  * Response: More details on the action
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.StartNewSession();
     azure.WriteToCurrentSession("Hey Azure!", function WriteToBlob(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(WriteToBlob,azure.WRITE_BLOB);
     });

```
     


###AddToBuffer(data,callback)

Adds to the 'buffer' for the current session
The 'buffer' is simply an array of data on the server, it sits there until cleared or written.

* **Parameters :** 
  * Data : Data to be written to Azure
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is ADD_TO_BUFFER
* **Returns :** 
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: Typically returns true or false depending on if successful
  * Response: More details on the action
* **Example:**    

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.StartNewSession();
     azure.AddToBuffer("Hey Azure!", function AddToBuffer(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(AddToBuffer,azure.ADD_TO_BUFFER);
     });
     
```
     

###WriteFromBuffer(callback)

Takes the data stored on the server within the current sessions 'buffer' and writes it to Azure
The buffer is cleared if the write operation is successful

* **Parameters :** 
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is WRITE_FROM_BUFFER
* **Returns :** 
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: Typically returns true or false depending on if successful
  * Response: More details on the action
* **Example:**    

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.StartNewSession();
     azure.AddToBuffer("Hey Azure!");
     azure.WriteFromBuffer("Hey Azure!", function WriteFromBuffer(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(WriteFromBuffer,azure.WRITE_FROM_BUFFER);
     });

```

###GetWriteBufferFromCurrent(callback)

Returns the 'buffer' for the current session

* **Parameters :** 
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is RECEIVE_WRITE_BUFFER
* **Returns :** 
  * Error: Error sent if the buffer cannot be found, or is empty
  * BufferData: The data within the buffer
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.StartNewSession();
     azure.AddToBuffer("Hey Azure!");
     azure.GetWriteBufferFromCurrent(function GetWriteBuffer(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(GetWriteBuffer,azure.RECEIVE_WRITE_BUFFER);
     });

```

###GetWriteBuffer(sessionId,callback)

Returns the 'buffer' for a specific session

* **Parameters :** 
  * sessionId : The session to be read from
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is RECEIVE_WRITE_BUFFER
* **Returns :** 
  * Error: Error sent if the buffer cannot be found, or is empty
  * BufferData: The data within the buffer
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.SetCurrentSession('test');
     azure.AddToBuffer("Hey Azure!");
     azure.StartNewSession();
     azure.GetWriteBuffer('test',function GetWriteBuffer(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(GetWriteBuffer,azure.RECEIVE_WRITE_BUFFER);
     }); 

```


###ClearWriteBufferOfCurrent(callback)

Clears the 'buffer' of the current session

* **Parameters :** 
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is CLEAR_WRITE_BUFFER
* **Returns :** 
  * Error: Error sent if the buffer cannot be found, or is empty
  * BufferData: The data within the buffer
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.SetCurrentSession('test');
     azure.AddToBuffer("Hey Azure!");
     azure.ClearWriteBufferOfCurrent(function ClearWriteBuffer(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ClearWriteBuffer,azure.CLEAR_WRITE_BUFFER);
     }); 

```


###ClearWriteBufferOfSession(sessionId,callback)

Clears the 'buffer' of the specific session

* **Parameters :** 
  * sessionId : The session to be worked with
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is CLEAR_WRITE_BUFFER
* **Returns :** 
  * Error: Error sent if the buffer cannot be found, or is empty
  * BufferData: The data within the buffer
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.SetCurrentSession('test');
     azure.AddToBuffer("Hey Azure!");
     azure.StartNewSession();
     azure.ClearWriteBufferOfCurrent('test',function ClearWriteBuffer(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ClearWriteBuffer,azure.CLEAR_WRITE_BUFFER);
     }); 

```
     
## Read Functions

###ListGameSessions(callback)

Lists all blobs within a container. In this case, the container with the uuid's name

* **Parameters :** 
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is LIST_BLOBS
* **Returns :**  
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: If error, will return the Result as this if not result will be stored in a List variable
  * Response: More details on the action
  * List: Contains the returned list of blobs in container
    * continuationToken : Used in order to read more data when the limit is hit
    * entries: Actual blob list
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.ListGameSessions(function ListBlobs(data){
        //Print out entries
        console.log(data.data.entries);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ListBlobs,azure.BLOB_LIST);
    });
    

```


###ReadFromSession(sessionId, separator, start, range, callback)

Reads from a specific session. The data is converted into text form, split up based on the separator and the desired pieces are returned

* **Parameters :** 
  * SessionId: Name of the session to read from
  * Separator: The character that separates sections of text
  * Start : The starting index for reading
  * Range : The range of data beginning with the start that you want read. Example, Start 0, and Range 2 will return the first two sections
  * Callback(data): Function to handle the Server response, if null a default callback will fire - Event ID is FILE_DATA
* **Returns :** 
  * Error: If something doesn't work, an error will be sent back
  * ServerError: Error generated by Azure
  * FileData: Array of data gathered from the Blob (without the separator)
  * LastPartSent: Last index sent
  * endOfBlob: Returns true if there is no more data to send from the Blob, false otherwise
  * BlobName : Name of blob read from
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.SetCurrentSession("test");
    azure.WriteToCurrentSession("Hello Azure!#I am split up data# Here is a section# Here is another");
    azure.ReadFromSession("test",'#',0,2,function ReadData(data){
        //data.data.endOfBlob : false
        //data.data.lastPartSent : 2
        console.log(data.data.fileData); //[Hello Azure!,I am split up data]
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ReadData,azure.FILE_DATA);
    });
    

```

###ReadFromSessionRaw(sessionId,callback)

Reads from a specific session. The entirety of the blob, in text form, is returned.
This allows the data to be parsed out on the client side. Obviously use this with caution, a larger file will take longer to pass along and could potentially tie up the application.

* **Parameters :** 
  * SessionId: Name of the session to read from
  * Callback(data): Function to handle the Server response, if null a default callback will fire - Event ID is FILE_DATA
* **Returns :** 
  * Error: If something doesn't work, an error will be sent back
  * ServerError: Error generated by Azure
  * FileData: Raw data from the blob in text form
  * BlobName : Name of blob read from
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.SetCurrentSession("test");
    azure.WriteToCurrentSession("Hello Azure!#I am split up data# Here is a section# Here is another");
    azure.ReadFromSessionRaw("test",function ReadDataRaw(data){
        console.log(data.data.fileData); //"Hello Azure!#I am split up data# Here is a section# Here is another"
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ReadDataRaw,azure.FILE_DATA);
    });
    

```

###ReadFromCurrentSession(separator,start,range,callback)

Reads from the current session. The data is converted into text form, split up based on the separator and the desired pieces are returned

* **Parameters :** 
  * Separator: The character that separates sections of text
  * Start : The starting index for reading
  * Range : The range of data beginning with the start that you want read. Example, Start 0, and Range 2 will return the first two sections
  * Callback(data): Function to handle the Server response, if null a default callback will fire - Event ID is FILE_DATA
* **Returns :** 
  * Error: If something doesn't work, an error will be sent back
  * ServerError: Error generated by Azure
  * FileData: Array of data gathered from the Blob (without the separator)
  * LastPartSent: Last index sent
  * endOfBlob: Returns true if there is no more data to send from the Blob, false otherwise
  * BlobName : Name of blob read from
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.SetCurrentSession("test");
    azure.WriteToCurrentSession("Hello Azure!#I am split up data# Here is a section# Here is another");
    azure.ReadFromCurrentSession('#',0,2,function ReadData(data){
        //data.data.endOfBlob : false
        //data.data.lastPartSent : 2
        console.log(data.data.fileData); //[Hello Azure!,I am split up data]
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ReadData,azure.FILE_DATA);
    });
    

```

###ReadFromCurrentSessionRaw(callback)

Reads from the current session. The entirety of the blob, in text form, is returned.
This allows the data to be parsed out on the client side. Obviously use this with caution, a larger file will take longer to pass along and could potentially tie up the application.

* **Parameters :** 
  * SessionId: Name of the session to read from
  * Callback(data): Function to handle the Server response, if null a default callback will fire - Event ID is FILE_DATA
* **Returns :** 
  * Error: If something doesn't work, an error will be sent back
  * ServerError: Error generated by Azure
  * FileData: Raw data from the blob in text form
  * BlobName : Name of blob read from
* **Example:**   

```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.SetCurrentSession("test");
    azure.WriteToCurrentSession("Hello Azure!#I am split up data# Here is a section# Here is another");
    azure.ReadFromCurrentSessionRaw("test",function ReadDataRaw(data){
        console.log(data.data.fileData); //"Hello Azure!#I am split up data# Here is a section# Here is another"
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(ReadDataRaw,azure.FILE_DATA);
    });
    

```

## Utility Functions

###Delete Operations

In order to work ALL delete or clear operations require AllowDeletion to be true, this can be done by calling AllowDeletion. Otherwise it will not work

###DeleteUser(callback)

Deletes the current user (deletes the container on the Azure Storage)

* **Parameters :** 
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is DELETE_CONTAINER
* **Returns :** 
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: Typically returns true or false depending on if successful
  * Response: More details on the action
* **Example:**    


```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    //Very important that deletion is allowed, otherwise this will not work
    azure.AllowDeletion();
    azure.DeleteUser(function DeleteUser(data){
        azure.FindAndRemoveEventListener(Deleteuser,azure.DELETE_CONTAINER);
    });


```



###ClearUserSaves(callback)

Clears all blobs stored on the container representing the user

* **Parameters :** 
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is CLEAR_CONTAINER
* **Returns :** 
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: Typically returns true or false depending on if successful
  * Response: More details on the action
* **Example:**    


```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    //Very important that deletion is allowed, otherwise this will not work
    azure.AllowDeletion();
    azure.ClearUserSaves(function ClearUser(data){
        azure.FindAndRemoveEventListener(ClearUser,azure.CLEAR_CONTAINER);
    });


```

###RemoveGameSession(sessionId, callback)

Removes a specific session

* **Parameters :** 
  * sessionId : The session that needs to be deleted
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is DELETE_BLOB
* **Returns :** 
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: Typically returns true or false depending on if successful
  * Response: More details on the action
* **Example:**    


```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.StartNewSession();
    azure.WriteToCurrentSession("Hello Azure!");
    
    //Very important that deletion is allowed, otherwise this will not work
    azure.AllowDeletion();
    azure.RemoveGameSession(azure.GetCurrentSession(),function RemoveSession(data){
        azure.FindAndRemoveEventListener(RemoveSession,azure.DELETE_BLOB);
    });


```

###DoesSessionExist(sessionId, callback)

Checks if a session exists

* **Parameters :** 
  * sessionId : The session that needs to be deleted
  * Callback(data) : Function to handle the Server response, if null a default callback will fire - Event ID is DELETE_BLOB
* **Returns :** 
  * Message: If present, will describe the situation (success or failure)
  * Error: Error received from Azure
  * Result: Returns true if session exists, false otherwise
* **Example:**    


```

    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
    azure.StartNewSession();
    azure.WriteToCurrentSession("Hello Azure!");
    
    azure.DoesSessionExist(azure.GetCurrentSession(),function SessionExist(data){
        console.log(data.data.Result); //true
        azure.FindAndRemoveEventListener(RemoveSession,azure.BLOB_EXIST);
    });
    
    
    azure.DoesSessionExist("Whatever",function SessionExist(data){
        console.log(data.data.Result); //false
        azure.FindAndRemoveEventListener(RemoveSession,azure.BLOB_EXIST);
    });


```

###FindAndRemoveEventListener(listener, eventName)

Utility function that finds and removes an event listener (named function) tied to a specific event (look below)

* **Parameters :** 
  * Listener(data): The function that was previously added to a Socket Event (so all callback functions). In order for this to work it must be a named function, anonymous functions will not work.
  * EventName: Name of the socket event that the function should listen to (look below for list of socket events)
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.StartNewSession();
     azure.WriteToCurrentSession("Hey Azure!", function WriteToBlob(data){
        //Print out data
        console.log(data);
        //Remove our temporary listener from socket.IO's event
        azure.FindAndRemoveEventListener(WriteToBlob,azure.WRITE_BLOB);
     });
     
     
```


###AddSocketEventListener(listener, eventName)

Utility function that adds an event listener (named function) to a socket event (real or imagined)

Use the list of Socket Events below in order for this to work

* **Parameters :** 
 * Listener(data): Function that will act as a listener and will be fired when the event occurs
 * EventName: Name of the socket event that the function should listen to (look below for list of socket events)

* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     //Add a function that listens for when data is sent back from the server
     //After receiving the data, it prints it out, forever because it is not named it cannot be easily removed
     //However, this sort of a function can have its purpose, for **Example:**  log how often a certain event occurs or do something no matter what
     azure.AddSocketEventListener(function(data){console.log(data);},azure.FILE_DATA);
     
     
```




###AllowDebug

Allows the default callbacks to print out the server's response

* **Parameters :**  None
* **Returns :**  None
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.AllowDebug();
     
```

###TurnOffDebug

Stops the default callbacks from printing out the server response

* **Parameters :**  None
* **Returns :**  None
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.TurnOffDebug();
     
```

###AllowDeletion

Stops the default callbacks from printing out the server response

* **Parameters :**  None
* **Returns :**  None
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.AllowDeletion();
     azure.DeleteUser(); //Will succeed
     
``` 

###ForbidDeletion

Stops the default callbacks from printing out the server response

* **Parameters :**  None
* **Returns :**  None
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","");
     azure.ForbidDeletion();
     azure.DeleteUser(); //Will fail
     
```

###UserID

Returns the current UserId

* **Parameters :**  None
* **Returns :**  userid (private variable)
* **Example:**   

```

     var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","test-user");
     console.log(azure.UserID); // test-user
     
```

###InitializationEvent

Event that is fired when a connection to Azure is established and everything is initialized

Event name is **Azure-Init**

* **Parameters :**  None
* **Returns :**  None
* **Example:**   

```
    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","test-user");
    document.addEventListener('AzureInit',function(e){
    			azure.SetCurrentSession("test");
    			azure.WriteToCurrentSession("Hello Azure");
    			
    		});
    
```

###IsInitialized

Returns whether the Azure connection is initialized, meaning a container exists for the user

* **Parameters :**  None
* **Returns :**  True if user's container has been created/exists, false if not
* **Example:**   


```
    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","test-user");
    
    console.log(azure.IsInitialized);//false
    
    document.addEventListener('AzureInit',function(e){

    			console.log(azure.IsInitialized);//true
          
    		});
    
```

###IsConnected

Returns whethere there is an azure connection, Socket.IO will drop in and out when inactive so expect this to not always be true.
The true test is the IsInitialized.
Expect a delay when using connected is false

* **Parameters :**  None
* **Returns :**  True if user's container has been created/exists, false if not
* **Example:**   


```
    var azure = new AzureGhostReplay("http://myazurewebsite.azurewebsites.net","test-user");
    
    console.log(azure.IsConnected);//false
    
    document.addEventListener('AzureInit',function(e){

    			console.log(azure.IsConnected);//true
          
    		});
    
```




##Socket Events

**LIST_BLOBS** : Fired on ListGameSessions 

**FILE_DATA** : Fired on all Read functions 

**NEW_CONTAINER** : Fired on initialization, when a container is created

**DELETE_BLOB** : Fired on RemoveGameSession

**DELETE_CONTAINER** : Fired on DeleteUser

**CLEAR_CONTAINER** : Fire on ClearUserSaves

**WRITE_BLOB** : Fired on all Write functions, except WriteFromBuffer

**WRITE_FROM_BUFFER** : Fired on WriteFromBuffer

**ADD_TO_BUFFER** : Fired on AddToBuffer

**CLEAR_WRITE_BUFFER** : Fired on ClearWriteBufferOfCurrent & ClearWriteBufferOfSession

**RECEIVE_WRITE_BUFFER** : Fired on GetWriteBufferFromCurrent & GetWriteBuffer

**BLOB_EXIST** : Fired on DoesSessionExist

## Expansion

Any questions, comments, concerns. Feel free to let me know, here or [@WStieh](https://twitter.com/wstieh)

Good luck and happy coding!
