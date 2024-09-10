'use client';

import { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import CodeMirror from '@uiw/react-codemirror';
import { Model, Query, RestBIClient, SQLResult, SQLError } from 'restbi-sdk';
import { ConvertQuestionToQuery } from '../prompts';


const client = new RestBIClient('http://localhost:3000');

interface QueryModelProps {
  activeModel: Model | null;
}

const QueryModel = ({ activeModel }: QueryModelProps) => {
  const [data, setData] = useState<SQLResult | null>(null);
  const [error, setError] = useState<SQLError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [query, setQuery] = useState<Query>({ columns: [], limit: 100 });

  const handleExecuteQuery = async () => {
    if (!activeModel) {
      return;
    }
    setLoading(true);
    try {
      const generatedQuery = await ConvertQuestionToQuery(activeModel.tables, searchQuery);

      setQuery(generatedQuery);
      const result = await client.executeQuery(generatedQuery, activeModel);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as SQLError);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  return (
    <main className="flex w-full min-h-screen flex-col items-center justify-between px-12 ">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Build Report</h1>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="search-input">
            Ask a question:
          </label>
          <input
            type="text"
            id="search-input"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Type your question"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <button
            onClick={handleExecuteQuery}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Run Query
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center mb-6">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
            <p className="ml-4">Executing query...</p>
          </div>
        )}

        {query && !loading && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Generated Query:</h3>
            <CodeMirror
              value={JSON.stringify(query, null, 2)}
              lang='json'
              editable={false}
            />
          </div>
        )}

        {data && !loading && (
          <div className="mt-6 w-full ag-theme-quartz" style={{ height: 500 }}>
            <AgGridReact
              rowData={data.rows}
              columnDefs={data.columns.map((col) => ({ headerName: col, field: col }))}
            />
          </div>
        )}

        {error && (
          <div className="flex flex-col justify-center w-full h-38 p-16">
            <div className="font-bold w-full flex justify-center text-2xl margin-auto text-red-400">Error</div>
            <div className="mt-2 w-full flex justify-center">{error.message}</div>
            <div className="text-lg font-bold mt-8">Generated SQL Query</div>
            <div className="mt-4">{error.query}</div>
          </div>
        )}
      </div>
    </main>
  );
};

export default QueryModel;
