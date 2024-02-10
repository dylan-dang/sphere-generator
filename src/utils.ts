

export function showError(message: string): never {
    Blockbench.showQuickMessage(message, 2000);
    throw new Error(message);
}