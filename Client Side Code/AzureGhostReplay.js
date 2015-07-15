/**
Copyright (c) 2015 Will Stieh @WStieh

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var AzureGhostReplay = function (url, uid) {

	var initialized = false;
	var connected = false;

	var allowBuffer = false;

	var writeDebug = true;
	
	//Response Event names
	var LIST_BLOBS = 'sendBlobList';
	var FILE_DATA = 'sendFileData';
	var NEW_CONTAINER = 'sendContainerResponse';
	var DELETE_BLOB = 'sendDeleteBlobResult';
	var DELETE_CONTAINER = 'sendDeleteContainerResult';
	var CLEAR_CONTAINER = 'sendClearContainerResult';
	var WRITE_BLOB = 'sendWriteBlobResult';
	var WRITE_FROM_BUFFER = 'sendWriteBufferResult';
	var ADD_TO_BUFFER = 'sendAddToBufferResult';
	var DEBUG_MESSAGE = 'serverMessage';
	var RECEIVE_WRITE_BUFFER = 'sendWriteBuffer';
	var CLEAR_WRITE_BUFFER = 'sendClearWriteBufferResult';
	var BLOB_EXIST = 'sendBlobExistResult';
	
	//Setup some events
	var initializationEvent = document.createEvent('Event');

	initializationEvent.initEvent('AzureInit', true, true);
	
	
	//Set the local userid
	var userId = uid;
	//if the user id is empty
	if (userId == '') {
		userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}


	var socket = io.connect(url + ':80');

	socket.on('connect', function () {
		
		//Print out we have connected
		console.log("Connected to server");
		allowBuffer = true;
		connected = true;
		socket.on(NEW_CONTAINER, function AddNewContainer(data) {
			if (typeof (data.data.Error) === 'undefined' || !data.data.Error) {

				initialized = true;
				document.dispatchEvent(initializationEvent);
				AzureGhostReplay.prototype.FindAndRemoveEventListener(AddNewContainer, NEW_CONTAINER);

			} else {
				//Create a container for ourselves
				socket.emit('createContainerIfNotExists', { containerName: userId, id: userId });
			}
		});



	});

	socket.on('disconnect', function () {
		console.log("Disconnected from server");
		allowBuffer = false;
		connected = false;
	});

	socket.on(DEBUG_MESSAGE, function (data) {
		AzureGhostReplay.prototype.PrintDebug(data)
	});
	
	//Tell the server that we exist
	//The ID is passed in so the Server can keep a record of all the connected clients 
	//That 'list' is there for sending messages back and to allow for custom ids
	socket.emit('newClient', { id: userId });
	
	//Current session to read/write to, init it to -1, this will act as a flag that it is not set
	var currentSession = '';

	var allowDeletion = false;
	
	
	
	//Read Functons******************************************************************************
	//Lists all the blobs in a container
	AzureGhostReplay.prototype.ListGameSessions = function (callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}
		//Add the callback as an event listener to the socket
		socket.on(LIST_BLOBS, callback || function GetList(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(GetList, LIST_BLOBS);
		});

		socket.emit('listBlobsInContainer', { containerName: userId, id: userId });
	};
	
	
	//Reads from a specific blob
	//Can attempt to parse the data into an object
	AzureGhostReplay.prototype.ReadFromCurrentSession = function (separator, start, range, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(FILE_DATA, callback || function ReadFileData(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(ReadFileData, FILE_DATA);
		});

		socket.emit('readFromBlob', { containerName: userId, blobName: currentSession, separator: separator, start: start, range: range, id: userId });

	};
	
	
	//Passes back the Raw Data from the session, allowing the user to parse it themselves
	AzureGhostReplay.prototype.ReadFromCurrentSessionRaw = function (callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(FILE_DATA, callback || function ReadFileDataRaw(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(ReadFileDataRaw, FILE_DATA);
		});

		socket.emit('readFromBlobRaw', { containerName: userId, blobName: currentSession, id: userId });

	};
	
	
	
	//Reads from a specific blob
	AzureGhostReplay.prototype.ReadFromSession = function (sessionId, separator, start, range, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}

		socket.on(FILE_DATA, callback || function ReadFileDataFromSelection(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(ReadFileDataFromSelection, FILE_DATA);
		});

		socket.emit('readFromBlob', { containerName: userId, blobName: sessionId, separator: separator, start: start, range: range, id: userId });

	};
	
	
	//Passes back the Raw Data from the session, allowing the user to parse it themselves
	AzureGhostReplay.prototype.ReadFromSessionRaw = function (sessionId, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}

		socket.on(FILE_DATA, callback || function ReadFileDataFromSelectionRaw(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(ReadFileDataFromSelectionRaw, FILE_DATA);
		});

		socket.emit('readFromBlobRaw', { containerName: userId, blobName: sessionId, id: userId });

	};
	
	//Write Functions***************************************************************************
	
	//Sets the current game session to the passed in value
	AzureGhostReplay.prototype.SetCurrentSession = function (sessionId) {
		currentSession = sessionId;
	};
	
	//Returns the current Session id
	AzureGhostReplay.prototype.GetCurrentSession = function () {
		return currentSession;
	}
	
	
	//Creates/Sets a new session
	AzureGhostReplay.prototype.StartNewSession = function () {
		//Get the date and time
		var d = new Date();
		//Build our session id
		currentSession = d.getUTCDay() + '-' + d.getUTCMonth() + '-' + d.getUTCFullYear() + '-' + d.getHours() + ':' + d.getMinutes() + ':' + d.getUTCMilliseconds() + '--' + userId;
	};
	
	//Checks if a session exists
	AzureGhostReplay.prototype.DoesSessionExist = function (sessionId, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}

		socket.on(BLOB_EXIST, callback || function DoesBlobExist(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(DoesBlobExist, BLOB_EXIST);
		});


		socket.emit('doesBlobExist', { containerName: userId, blobName: sessionId, id: userId });
	};
	
	
	//Writes data to the current session
	AzureGhostReplay.prototype.WriteToCurrentSession = function (data, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(WRITE_BLOB, callback || function WriteBlob(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(WriteBlob, WRITE_BLOB);
		});


		socket.emit('writeToBlob', { containerName: userId, blobName: currentSession, data: data, id: userId });
	};
	
	
	//Writes to a buffer for a the current session
	//To be used in conjunction with WriteDataFromBuffer
	AzureGhostReplay.prototype.AddToBuffer = function (newData, callback) {
		if (!allowBuffer) {
			console.log("Cannot Access Buffer Yet");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(ADD_TO_BUFFER, callback || function AddToBuffer(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(AddToBuffer, ADD_TO_BUFFER);
		});


		socket.emit('addToBuffer', { containerName: userId, blobName: currentSession, data: newData, id: userId });
	};
	
	
	//Gets the current session's write buffer
	AzureGhostReplay.prototype.GetWriteBufferOfCurrentSession = function (callback) {
		if (!allowBuffer) {
			console.log("Cannot Access Buffer Yet");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(RECEIVE_WRITE_BUFFER, callback || function GetWriteBufferOfCurrent(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(GetWriteBufferOfCurrent, RECEIVE_WRITE_BUFFER);
		});


		socket.emit('getWriteBuffer', { containerName: userId, blobName: currentSession, id: userId });
	};
	
	//Gets the current session's write buffer
	AzureGhostReplay.prototype.GetWriteBufferOfSession = function (sessionId, callback) {
		if (!allowBuffer) {
			console.log("Cannot Access Buffer Yet");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(RECEIVE_WRITE_BUFFER, callback || function GetWriteBuffer(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(GetWriteBuffer, RECEIVE_WRITE_BUFFER);
		});


		socket.emit('getWriteBuffer', { containerName: userId, blobName: sessionId, id: userId });
	};
	
	
	
	
	
	
	//Writes the data stored in the buffer to the blob
	AzureGhostReplay.prototype.WriteFromBuffer = function (callback) {
		if (!allowBuffer) {
			console.log("Cannot Access Buffer Yet");
			return;
		}

		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(WRITE_FROM_BUFFER, callback || function WriteFromBuffer(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(WriteFromBuffer, WRITE_FROM_BUFFER);
		});

		socket.emit('writeFromBuffer', { containerName: userId, blobName: currentSession, id: userId });
	};
	
	
	
	
	//Utility Functions*************************************************************************
	
	//Clears all the game sessions of the current user
	AzureGhostReplay.prototype.ClearUserSaves = function (callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}

		if (allowDeletion) {

			socket.on(CLEAR_CONTAINER, callback || function ClearSaves(data) {
				AzureGhostReplay.prototype.PrintDebug(data)
				AzureGhostReplay.prototype.FindAndRemoveEventListener(ClearSaves, CLEAR_CONTAINER);
			});

			socket.emit('clearContainer', { containerName: userId, id: userId });
		} else {
			console.log("Cannot Delete");
		}
	};
	
	//Completely deletes the user
	//This is useful when the user's id is changing
	//Before this can be used, the service must be told to allow deletion
	AzureGhostReplay.prototype.DeleteUser = function (callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}


		if (allowDeletion) {

			socket.on(DELETE_CONTAINER, callback || function removeUser(data) {
				AzureGhostReplay.prototype.PrintDebug(data)
				AzureGhostReplay.prototype.FindAndRemoveEventListener(removeUser, DELETE_CONTAINER);
			});

			socket.emit('deleteContainer', { containerName: userId, id: userId });
		} else {
			console.log("Cannot delete records");
		}
	};


	AzureGhostReplay.prototype.RemoveGameSession = function (sessionId, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}

		if (allowDeletion) {
			socket.on(DELETE_BLOB, callback || function RemoveSession(data) {
				AzureGhostReplay.prototype.PrintDebug(data)
				AzureGhostReplay.prototype.FindAndRemoveEventListener(RemoveSession, DELETE_BLOB);
			});

			socket.emit('deleteBlob', { containerName: userId, blobName: sessionId });
		} else {
			console.log("Cannot delete records");
		}
	};




	AzureGhostReplay.prototype.ClearWriteBufferOfCurrent = function (callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(CLEAR_WRITE_BUFFER, callback || function GetWriteBufferOfCurrent(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(GetWriteBufferOfCurrent, CLEAR_WRITE_BUFFER);
		});


		socket.emit('clearWriteBuffer', { containerName: userId, blobName: currentSession, id: userId });
	};

	AzureGhostReplay.prototype.ClearWriteBuffer = function (sessionId, callback) {
		if (!initialized) {
			console.log("Azure Connection Not Initialized");
			return;
		}
		
		//If current session is not set, we throw an error
		if (currentSession === '') {
			throw "Current Session Not Set";
		}

		socket.on(CLEAR_WRITE_BUFFER, callback || function GetWriteBufferOfCurrent(data) {
			AzureGhostReplay.prototype.PrintDebug(data)
			AzureGhostReplay.prototype.FindAndRemoveEventListener(GetWriteBufferOfCurrent, CLEAR_WRITE_BUFFER);
		});


		socket.emit('clearWriteBuffer', { containerName: userId, blobName: sessionId, id: userId });
	};
	
	//Utility function that allows you to attach a listener to an event
	AzureGhostReplay.prototype.AddSocketEventListener = function (listener, eventName) {
		socket.on(eventName, listener);
	};

	//Utility function, that finds and removes a listener from the socket
	//Listener is the function name
	//Eventname is the socket event it needs to check
	AzureGhostReplay.prototype.FindAndRemoveEventListener = function (listener, eventName) {
		if (socket._callbacks.hasOwnProperty(eventName)) {
			if (socket._callbacks[eventName].indexOf(listener) >= 0) {
				socket._callbacks[eventName].splice(socket._callbacks[eventName].indexOf(listener), 1);
			} else {
				console.log("Listener does not exist on Socket");
			}
		} else {
			console.log("Event: " + eventName + " could not be found on Socket");
		}
	};
	
	/*****************************
	 * Writes a debug or other returned message to the console
	*************************** */
	AzureGhostReplay.prototype.PrintDebug = function (message) {
		if (writeDebug) {
			console.log(message);
		}
	}
	
	/***************
	 * Allows Debug messages to be written
	********************* */
	AzureGhostReplay.prototype.AllowDebug = function () {
		writeDebug = true;
	};
	
	/************************
	 * Stops debug messages from being printed
	************************** */
	AzureGhostReplay.prototype.TurnOffDebug = function () {
		writeDebug = false;
	};

	/**********************
	 * Allows the user from deleting records
	**************************** */
	AzureGhostReplay.prototype.AllowDeletion = function () {
		allowDeletion = true;
	};

	/**********************
	 * Stops the deletion of records
	******************************* */
	AzureGhostReplay.prototype.ForbidDeletion = function () {
		allowDeletion = false;
	};
	
	/**************
	 * Returns whether it is initialized or not
	**************** */
	AzureGhostReplay.prototype.IsInitialized = function () {
		if (initialized) {
			return true;
		} else {
			return false;
		}
	}

	/**********************************
	 * Returns whether we are currently connected or not
	******************************* */
	AzureGhostReplay.prototype.IsConnected = function () {
		if (connected) {
			return true;
		} else {
			return false;
		}
	}
	
			
	
	//Returns
	return {
		Socket: socket,
		AllowDebug: AzureGhostReplay.prototype.AllowDebug,
		TurnOffDebug: AzureGhostReplay.prototype.TurnOffDebug,
		AllowDeletion: AzureGhostReplay.prototype.AllowDeletion,
		ForbidDeletion: AzureGhostReplay.prototype.ForbidDeletion,
		UserID: userId,
		InitializationEvent: initializationEvent,
		IsInitialized: AzureGhostReplay.prototype.IsInitialized,
		//Read Functions
		ListGameSessions: AzureGhostReplay.prototype.ListGameSessions,
		ReadFromSession: AzureGhostReplay.prototype.ReadFromSession,
		ReadFromSessionRaw: AzureGhostReplay.prototype.ReadFromSessionRaw,
		ReadFromCurrentSession: AzureGhostReplay.prototype.ReadFromCurrentSession,
		ReadFromCurrentSessionRaw: AzureGhostReplay.prototype.ReadFromCurrentSessionRaw,
		//Set/Create Session
		SetCurrentSession: AzureGhostReplay.prototype.SetCurrentSession,
		GetCurrentSession: AzureGhostReplay.prototype.GetCurrentSession,
		StartNewSession: AzureGhostReplay.prototype.StartNewSession,
		//Write Functions
		WriteToCurrentSession: AzureGhostReplay.prototype.WriteToCurrentSession,
		AddToBuffer: AzureGhostReplay.prototype.AddToBuffer,
		WriteFromBuffer: AzureGhostReplay.prototype.WriteFromBuffer,
		GetWriteBufferFromCurrent: AzureGhostReplay.prototype.GetWriteBufferOfCurrentSession,
		GetWriteBuffer: AzureGhostReplay.prototype.GetWriteBufferOfSession,
		ClearWriteBufferOfCurrent: AzureGhostReplay.prototype.ClearWriteBufferOfCurrent,
		ClearWriteBufferOfSession: AzureGhostReplay.prototype.ClearWriteBuffer,
		//Utility functions
		DeleteUser: AzureGhostReplay.prototype.DeleteUser,
		ClearUserSaves: AzureGhostReplay.prototype.ClearUserSaves,
		RemoveGameSession: AzureGhostReplay.prototype.RemoveGameSession,
		DoesSessionExist: AzureGhostReplay.prototype.DoesSessionExist,
		FindAndRemoveEventListener: AzureGhostReplay.prototype.FindAndRemoveEventListener,
		AddSocketEventListener: AzureGhostReplay.prototype.AddSocketEventListener,
		IsConnected : AzureGhostReplay.prototype.IsConnected,
		//Server Events
		LIST_BLOBS: LIST_BLOBS,
		FILE_DATA: FILE_DATA,
		NEW_CONTAINER: NEW_CONTAINER,
		DELETE_BLOB: DELETE_BLOB,
		DELETE_CONTAINER: DELETE_CONTAINER,
		CLEAR_CONTAINER: CLEAR_CONTAINER,
		WRITE_BLOB: WRITE_BLOB,
		WRITE_FROM_BUFFER: WRITE_FROM_BUFFER,
		ADD_TO_BUFFER: ADD_TO_BUFFER,
		CLEAR_WRITE_BUFFER: CLEAR_WRITE_BUFFER,
		RECEIVE_WRITE_BUFFER: RECEIVE_WRITE_BUFFER,
		BLOB_EXIST: BLOB_EXIST

	};
};