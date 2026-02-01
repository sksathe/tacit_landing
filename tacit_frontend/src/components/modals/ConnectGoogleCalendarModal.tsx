"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface ConnectGoogleCalendarModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConnect: () => void;
    isConnected: boolean;
}

export function ConnectGoogleCalendarModal({
    open,
    onOpenChange,
    onConnect,
    isConnected,
}: ConnectGoogleCalendarModalProps) {
    const handleConnect = () => {
        onConnect();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle>Connect Google Calendar</DialogTitle>
                    </div>
                    <DialogDescription>
                        Connect your Google Calendar to automatically import meetings and schedule sessions.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isConnected ? (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground">
                                Google Calendar is already connected.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                By connecting Google Calendar, you allow Tacit to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                                <li>Read your calendar events</li>
                                <li>Import meetings automatically</li>
                                <li>Schedule sessions from calendar events</li>
                            </ul>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {isConnected ? "Close" : "Cancel"}
                    </Button>
                    {!isConnected && (
                        <Button
                            type="button"
                            className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                            onClick={handleConnect}
                        >
                            Connect Google Calendar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

