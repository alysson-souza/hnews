// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';

export type CommandHandler = () => void | Promise<void>;

@Injectable({
  providedIn: 'root',
})
export class CommandRegistryService {
  private commands = new Map<string, CommandHandler>();

  /**
   * Register a command handler
   */
  register(commandId: string, handler: CommandHandler): void {
    if (this.commands.has(commandId)) {
      console.warn(`Command '${commandId}' is already registered. Overwriting.`);
    }
    this.commands.set(commandId, handler);
  }

  /**
   * Unregister a command
   */
  unregister(commandId: string): void {
    this.commands.delete(commandId);
  }

  /**
   * Execute a command by ID
   */
  async execute(commandId: string): Promise<void> {
    const handler = this.commands.get(commandId);
    if (handler) {
      await handler();
    } else {
      console.warn(`Command '${commandId}' not found.`);
    }
  }

  /**
   * Check if a command is registered
   */
  hasCommand(commandId: string): boolean {
    return this.commands.has(commandId);
  }
}
