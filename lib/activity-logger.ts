import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import { activities } from "./db/schemas";

type ActivityOptions = {
    boardId: string;
    userId: string;
    action: string;
    message?: string;
    collectionId?: string; // Made optional since not always needed
    itemId?: string;
};

export class ActivityLogger {
    static async log(opts: ActivityOptions) {
        const activity = {
            id: uuidv4(),
            boardId: opts.boardId,
            collectionId: opts.collectionId ?? null,
            itemId: opts.itemId ?? null, // Fixed: was "ItemId"
            userId: opts.userId,
            action: opts.action,
            message: opts.message ?? "",
            createdAt: new Date(),
        };
        
        try {
            await db.insert(activities).values(activity);
            console.log('Activity logged:', activity);
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Don't throw - logging shouldn't break the main flow
        }
    }
}