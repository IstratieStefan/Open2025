'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { toast } from 'sonner';

export type LogLevel = 'info' | 'status' | 'error' | 'warning' | 'command' | 'response';

export interface LogEntry {
	id: string;
	timestamp: Date;
	level: LogLevel;
	message: string;
	details?: string;
}

interface LoggingState {
	logs: LogEntry[];
	maxLogs: number;
}

type LoggingAction =
	| { type: 'ADD_LOG'; payload: Omit<LogEntry, 'id' | 'timestamp'> }
	| { type: 'CLEAR_LOGS' }
	| { type: 'SET_MAX_LOGS'; payload: number };

interface LoggingContextType {
	logs: LogEntry[];
	addLog: (level: LogLevel, message: string, details?: string) => void;
	addInfo: (message: string, details?: string) => void;
	addStatus: (message: string, details?: string) => void;
	addError: (message: string, details?: string) => void;
	addWarning: (message: string, details?: string) => void;
	addCommand: (message: string, details?: string) => void;
	addResponse: (message: string, details?: string) => void;
	clearLogs: () => void;
	setMaxLogs: (max: number) => void;
}

const LoggingContext = createContext<LoggingContextType | undefined>(undefined);

function loggingReducer(state: LoggingState, action: LoggingAction): LoggingState {
	switch (action.type) {
		case 'ADD_LOG': {
			const newLog: LogEntry = {
				id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				timestamp: new Date(),
				...action.payload,
			};

			const newLogs = [newLog, ...state.logs];
			
			// Keep only the latest maxLogs entries
			if (newLogs.length > state.maxLogs) {
				newLogs.splice(state.maxLogs);
			}

			return {
				...state,
				logs: newLogs,
			};
		}
		case 'CLEAR_LOGS':
			return {
				...state,
				logs: [],
			};
		case 'SET_MAX_LOGS':
			return {
				...state,
				maxLogs: action.payload,
			};
		default:
			return state;
	}
}

interface LoggingProviderProps {
	children: ReactNode;
	maxLogs?: number;
}

export function LoggingProvider({ children, maxLogs = 1000 }: LoggingProviderProps) {
	const [state, dispatch] = useReducer(loggingReducer, {
		logs: [],
		maxLogs,
	});

	const addLog = (level: LogLevel, message: string, details?: string) => {
		dispatch({
			type: 'ADD_LOG',
			payload: { level, message, details },
		});

		// Show toast notifications for status and errors
		if (level === 'status') {
			toast.info(message);
		} else if (level === 'error') {
			toast.error(message);
		} else if (level === 'warning') {
			toast.warning(message);
		}
	};

	const addInfo = (message: string, details?: string) => addLog('info', message, details);
	const addStatus = (message: string, details?: string) => addLog('status', message, details);
	const addError = (message: string, details?: string) => addLog('error', message, details);
	const addWarning = (message: string, details?: string) => addLog('warning', message, details);
	const addCommand = (message: string, details?: string) => addLog('command', message, details);
	const addResponse = (message: string, details?: string) => addLog('response', message, details);

	const clearLogs = () => dispatch({ type: 'CLEAR_LOGS' });
	const setMaxLogs = (max: number) => dispatch({ type: 'SET_MAX_LOGS', payload: max });

	const contextValue: LoggingContextType = {
		logs: state.logs,
		addLog,
		addInfo,
		addStatus,
		addError,
		addWarning,
		addCommand,
		addResponse,
		clearLogs,
		setMaxLogs,
	};

	return (
		<LoggingContext.Provider value={contextValue}>
			{children}
		</LoggingContext.Provider>
	);
}

export function useLogging() {
	const context = useContext(LoggingContext);
	if (context === undefined) {
		throw new Error('useLogging must be used within a LoggingProvider');
	}
	return context;
}