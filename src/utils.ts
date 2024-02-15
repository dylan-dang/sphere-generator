

export function error(message: string): Error {
    Blockbench.showQuickMessage(message, 2000);
    return new Error(message);
}