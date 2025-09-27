import { writable } from "svelte/store";

function createDataAnalysisStore() {
  const { subscribe, set, update } = writable({
    datasets: [],
    currentDataset: null,
    analyses: [],
    isAnalyzing: false,
  });

  return {
    subscribe,

    addDataset: (dataset) =>
      update((state) => ({
        ...state,
        datasets: [
          ...state.datasets,
          {
            id: Date.now(),
            ...dataset,
            createdAt: new Date(),
          },
        ],
      })),

    selectDataset: (id) =>
      update((state) => ({
        ...state,
        currentDataset: state.datasets.find((d) => d.id === id),
      })),

    removeDataset: (id) =>
      update((state) => ({
        ...state,
        datasets: state.datasets.filter((d) => d.id !== id),
        currentDataset:
          state.currentDataset?.id === id ? null : state.currentDataset,
      })),

    addAnalysis: (analysis) =>
      update((state) => ({
        ...state,
        analyses: [
          ...state.analyses,
          {
            id: Date.now(),
            ...analysis,
            timestamp: new Date(),
          },
        ],
      })),

    setAnalyzing: (isAnalyzing) =>
      update((state) => ({
        ...state,
        isAnalyzing,
      })),

    clearAnalyses: () =>
      update((state) => ({
        ...state,
        analyses: [],
      })),
  };
}

export const dataAnalysisStore = createDataAnalysisStore();
