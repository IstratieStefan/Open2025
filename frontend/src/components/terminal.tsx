'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogging, type LogEntry, type LogLevel } from '@/lib/logging-context';
import { Terminal as TerminalIcon, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalProps {
	onCommand?: (command: string) => void;
	className?: string;
}

const logLevelStyles: Record<LogLevel, string> = {
	info: 'text-foreground font-bold',
	status: 'text-foreground',
	error: 'text-red-500',
	warning: 'text-yellow-500',
	command: 'text-blue-400 bg-blue-50/10 px-2 py-1 rounded border-l-2 border-blue-400',
	response: 'text-green-400',
};

const logLevelLabels: Record<LogLevel, string> = {
	info: 'INFO',
	status: 'STATUS',
	error: 'ERROR',
	warning: 'WARN',
	command: 'CMD',
	response: 'RESP',
};

function LogEntryComponent({ entry }: { entry: LogEntry }) {
	const timestamp = entry.timestamp.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});

	return (
		<div className={cn('flex gap-2 text-[10px] font-mono', logLevelStyles[entry.level])}>
			<span className="text-muted-foreground shrink-0">[{timestamp}]</span>
			<span className="text-muted-foreground shrink-0 w-8">
				{logLevelLabels[entry.level]}
			</span>
			<span className="break-all">{entry.message}</span>
			{entry.details && (
				<span className="text-muted-foreground ml-2">({entry.details})</span>
			)}
		</div>
	);
}

export function Terminal({ onCommand, className }: TerminalProps) {
	const { logs, clearLogs, addCommand, addResponse } = useLogging();
	const [command, setCommand] = useState('');
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const terminalRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom when new logs are added
	useEffect(() => {
		if (terminalRef.current) {
			terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
		}
	}, [logs]);

	const handleSubmitCommand = () => {
		if (!command.trim()) return;

		// Add command to logs
		addCommand(`> ${command}`);

		// Add to history
		setCommandHistory((prev) => [command, ...prev].slice(0, 50)); // Keep last 50 commands
		setHistoryIndex(-1);

		// Execute command
		if (onCommand) {
			try {
				onCommand(command);
			} catch (error) {
				addResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		} else {
			// Default command handling
			handleDefaultCommand(command);
		}

		setCommand('');
	};

	const handleDefaultCommand = (cmd: string) => {
		const [action, ...args] = cmd.toLowerCase().split(' ');
		
		switch (action) {
			case 'help':
				addResponse('Available commands: help, clear, status, version, echo <message>');
				break;
			case 'clear':
				clearLogs();
				addResponse('Terminal cleared');
				break;
			case 'status':
				addResponse('Scanner system operational');
				break;
			case 'version':
				addResponse('Scanner Control System v1.0.0');
				break;
			case 'echo':
				addResponse(args.join(' ') || 'echo: no message provided');
				break;
			default:
				addResponse(`Unknown command: ${action}. Type 'help' for available commands.`);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmitCommand();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (historyIndex < commandHistory.length - 1) {
				const newIndex = historyIndex + 1;
				setHistoryIndex(newIndex);
				setCommand(commandHistory[newIndex]);
			}
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex > 0) {
				const newIndex = historyIndex - 1;
				setHistoryIndex(newIndex);
				setCommand(commandHistory[newIndex]);
			} else if (historyIndex === 0) {
				setHistoryIndex(-1);
				setCommand('');
			}
		}
	};

	const focusInput = () => {
		inputRef.current?.focus();
	};

	return (
		<Card className={cn('h-full pb-0 flex flex-col', className)}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<TerminalIcon className="h-5 w-5" />
						System Terminal
					</CardTitle>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={clearLogs}
							className="h-8"
						>
							<Trash2 className="h-4 w-4" />
							Clear
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
				{/* Terminal Output */}
				<div
					ref={terminalRef}
					className="h-44 max-h-44 min-h-44 flex-1 bg-black/5 dark:bg-black/20 rounded-md p-3 overflow-y-auto font-mono text-[10px] cursor-text"
					onClick={focusInput}
				>
					{logs.length === 0 ? (
						<div className="text-muted-foreground italic">
							Terminal ready. Type 'help' for available commands.
						</div>
					) : (
						<div className="space-y-1">
							{logs.map((entry) => (
								<LogEntryComponent key={entry.id} entry={entry} />
							))}
						</div>
					)}
				</div>

				{/* Command Input */}
				<div className="flex gap-2">
					<div className="flex-1 relative">
						<Input
							ref={inputRef}
							value={command}
							onChange={(e) => setCommand(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Enter command..."
							className="font-mono"
							autoFocus
						/>
					</div>
					<Button
						onClick={handleSubmitCommand}
						disabled={!command.trim()}
						size="sm"
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>

				{/* Status bar */}
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>{logs.length} log entries</span>
					<span>Use ↑↓ for command history</span>
				</div>
			</CardContent>
		</Card>
	);
}