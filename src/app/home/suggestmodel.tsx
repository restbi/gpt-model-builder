'use client';

import { Table } from "restbi-sdk";
import { PossibleModel, ListPossibleModels } from "../prompts";
import { getMetadata } from "../restbi_util";
import { connection } from "../page";
import { useState, useEffect } from "react";

interface SuggestModelsProps {
  metadata: Table[];
  setSuggestedModel: (model: PossibleModel) => void;
}

const SuggestModel = ({ metadata, setSuggestedModel }: SuggestModelsProps) => {
  const [possibleModels, setPossibleModels] = useState<PossibleModel[]>([]);
  const [suggestionInput, setSuggestionInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    ListPossibleModels(metadata)
      .then((generatedModels) => {
        setPossibleModels(generatedModels);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch metadata:", error);
        setLoading(false);
      });
  }, []);

  const handleModifySuggestions = () => {
    setLoading(true);
    if (suggestionInput !== "") {
      ListPossibleModels(metadata, suggestionInput)
        .then((generatedModels) => {
          setPossibleModels(generatedModels);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to modify suggestions:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuggestionInput(e.target.value);
  };

  return (
    <main className="flex w-full min-h-screen flex-col items-center justify-between px-12">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Database Scan Results</h1>
        <div className="mb-8">
          <p className="text-lg text-gray-700">Tables Found: {metadata.length}</p>
          <p className="text-lg text-gray-700">
            Columns Found: {metadata.reduce((acc, table) => acc + table.columns.length, 0)}
          </p>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Suggested Models</h2>
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
            </div>
          ) : possibleModels.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {possibleModels.map((model, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="text-xl font-medium text-gray-800 mb-2">{model.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Tables:</strong> {model.tables.join(", ")}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Reason:</strong> {model.reason}
                  </div>
                  <button
                    className="mt-4 bg-green-300 px-5 py-2 rounded-lg hover:bg-green-400 transition duration-300"
                    onClick={() => setSuggestedModel(model)}
                  >
                    Create
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No models could be suggested based on the current metadata.</p>
          )}
        </div>
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-800 mb-2" htmlFor="suggestionInput">
            Modify Suggestions
          </label>
          <input
            type="text"
            id="suggestionInput"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition duration-300"
            placeholder="Enter your suggestions"
            value={suggestionInput}
            onChange={handleInputChange}
          />
          <button
            className="mt-4 bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            onClick={handleModifySuggestions}
          >
            Modify
          </button>
        </div>
      </div>
    </main>
  );
};

export default SuggestModel;
