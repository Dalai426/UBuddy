import { ClientSession, Mongoose } from "mongoose";

export async function runInTransaction<T>(
    mongoose: Mongoose,
    mutations: (session: ClientSession, ...args: any[]) => Promise<T>,
    ...args: any[]
): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const value = await mutations(session, ...args);
        await session.commitTransaction();
        return value;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
