export interface Evaluation {
    readOld: boolean
    readNew: boolean
    writeOld: boolean
    writeNew: boolean
    useNew: boolean
}

export interface Evaluatable {
    evaluate: () => Evaluation | Promise<Evaluation>
}
