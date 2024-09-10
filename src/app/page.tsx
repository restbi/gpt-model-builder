'use client'
import { Connection, DatabaseType, Model, SQLError, Table } from "restbi-sdk";
import { getMetadata } from "./restbi_util";
import { ListPossibleModels, PossibleModel } from "./prompts";
import { useEffect, useState } from "react";
import SuggestModel from "./home/suggestmodel";
import CreateModel from "./home/createmodel";
import QueryModel from "./home/querymodel";

export const connection: Connection = {
  id: '1',
  name: 'Postgres',
  host: 'localhost', // Ensure this is correct for your environment
  port: 5432,
  user: 'postgres',
  password: 'test',
  database: 'dvdrental',
  type: DatabaseType.POSTGRES,
};

enum Step {
  SUGGEST_MODEL,
  CREATE_MODEL,
  QUERY_MODEL,
}

export default function Home() {
  const [suggestedModel, setSuggestedModel] = useState<PossibleModel | null>(null);
  const [step, setStep] = useState<Step>(Step.SUGGEST_MODEL);
  const [metadata, setMetadata] = useState<Table[]>([]);
  const [activeModel, setActiveModel] = useState<Model | null>(null);

  useEffect(() => {
    getMetadata(connection)
      .then((fetchedMetadata) => {
        setMetadata(fetchedMetadata);
      })
      .catch((error: SQLError) => {
        console.error("Failed to fetch metadata:", error);
      });
  }, []);

  useEffect(() => {
    if (step === Step.SUGGEST_MODEL && suggestedModel) {
      setStep(Step.CREATE_MODEL)
    }
  }, [suggestedModel]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between font-mono  p-12 bg-gray-50">
      <section className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex flex-col flex">
        <header className="w-full flex items-center   max-w-4xl mb-2" >
          <div className="flex space-x-4 bg-white shadow rounded-lg p-2">
            <button
              className={`px-6 py-3 rounded-lg hover:text-white font-semibold transition-colors duration-300 ${step === Step.SUGGEST_MODEL ? 'bg-blue-400 text-white' : ' bg-gray-200 hover:bg-blue-300 hover:text-white  text-gray-700 '}`}
              onClick={() => setStep(Step.SUGGEST_MODEL)}
            >
            1. Suggest Model
            </button>
            <button
              className={`px-6 py-3 rounded-lg hover:text-white font-semibold transition-colors duration-300 ${step === Step.CREATE_MODEL ? 'bg-blue-400 text-white' : 'bg-gray-200 hover:bg-blue-300 hover:text-white  text-gray-700 '}`}
              onClick={() => setStep(Step.CREATE_MODEL)}
            >
            2. Create Model
            </button>
            <button
              className={`px-6 py-3 rounded-lg hover:text-white font-semibold transition-colors duration-300 ${step === Step.QUERY_MODEL ? 'bg-blue-400 text-white' : 'bg-gray-200 hover:bg-blue-300 hover:text-white  text-gray-700 '}`}
              onClick={() => setStep(Step.QUERY_MODEL)}
            >
            3. Query Model
            </button>
          </div>
        </header>
        <div className="flex flex-col items-center justify-between w-full">
          {step === Step.SUGGEST_MODEL && (
            <SuggestModel metadata={metadata} setSuggestedModel={setSuggestedModel} />
          )}
          {step === Step.CREATE_MODEL && suggestedModel && (
            <CreateModel metadata={metadata} suggestedModel={suggestedModel} setActiveModel={setActiveModel} />
          )}
          {step === Step.QUERY_MODEL && (
            <QueryModel activeModel={activeModel} />
          )}
        </div>
      </section>
    </main>
  );
}
