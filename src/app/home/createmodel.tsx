'use client';

import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Model, RestBIClient, Table, ValidationResult } from 'restbi-sdk';
import { CreateJoinsFromSuggested, CreateModelFromSuggested, CreateTableFromSuggested, FixModel, PossibleModel } from '../prompts';
import { connection } from '../page';

interface CreateModelProps {
  suggestedModel: PossibleModel;
  metadata: Table[];
  setActiveModel: (model: Model) => void;
}

let client = new RestBIClient('http://localhost:3000');

const CreateModel = ({ suggestedModel, metadata, setActiveModel }: CreateModelProps) => {
  const [model, setModel] = useState<Model | null>(null);
  const [validated, setValidated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>("");

  const handleCreateModel = async () => {
    setLoading(true);
    let newModel: Model = {
      tables: [],
      connection: connection,
      id: '',
      name: suggestedModel.name,
      joins: [],
      formulas: [],
      filters: []
    }
    for (let tableName of suggestedModel.tables) {
      let table = await CreateTableFromSuggested(metadata, tableName, suggestion);
      newModel.tables.push(table);
    }
    let joins = await CreateJoinsFromSuggested(metadata, suggestedModel, suggestion);
    newModel.joins = joins;
    //const newModel = await CreateModelFromSuggested(metadata, suggestedModel, suggestion);
    
    
    setModel(newModel);
    setLoading(false);
    newModel.connection = connection;
    client.validateModel(newModel).then((result: ValidationResult) => {
       let errors =  generateErrorList(result.model.tables);
        if (errors.length > 0) {
          setValidated(false);
          fixModel(newModel, errors.join(', '));
          console.error('Model validation failed:', errors);
        } else {
          setValidated(true);
          setActiveModel(newModel);
        }
    }).catch((error) => {
      console.error('Failed to validate model:', error);
    });
  };
  const fixModel = async (model: Model, errors: string) => {
    setLoading(true);
    const newModel = await FixModel(metadata,model,errors);
    newModel.connection = connection;
    client.validateModel(newModel).then((result: ValidationResult) => {
       let errors =  generateErrorList(result.model.tables);
        if (errors.length > 0) {
          setValidated(false);
          console.error('Model validation failed:', errors);
        } else {
          setValidated(true);
          setActiveModel(newModel);
        }
    }).catch((error) => {
      console.error('Failed to validate model:', error);
    });
  }

  const handleSuggestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSuggestion(event.target.value);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between px-13">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Create Model</h1>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Suggested Model:</h3>
          <CodeMirror
            value={JSON.stringify(suggestedModel, null, 2)}
            lang='json'
            editable={false}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-lg font-medium mb-2" htmlFor="suggestion-input">
            Add your suggestion:
          </label>
          <input
            type="text"
            id="suggestion-input"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter your suggestion"
            value={suggestion}
            onChange={handleSuggestionChange}
            disabled={loading}
          />
        </div>
        
        <div className="mb-6 flex flex-row space-x-2">
          <button
            onClick={handleCreateModel}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Create Model
          </button>
          {!loading && model && (
              <div className={`text-sm ${validated ? 'bg-green-500' : 'bg-gray-500'} text-white px-4 py-2  rounded-md`}>
                {validated ? 'Model validated successfully' : 'Model validation failed'}
              </div>
          )}

        </div>

        {loading && (
          <div className="flex justify-center items-center mb-6">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
            <p className="ml-4">Generating model...</p>
          </div>
        )}

        {model && !loading && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Generated Model:</h3>
            <CodeMirror
              value={JSON.stringify(model, null, 2)}
              lang='json'
              editable={true}
            />
          </div>
        )}
      </div>
    </main>
  );
};

const generateErrorList = (tables: Table[]) => {
  const errors: string[] = [];
  // Iterate over tables and columns to find and log validation errors
  tables.forEach((table) => {
      if (!table.validated) {
          errors.push(`Invalid Table: ${table.name}`);
      }
      table.columns.forEach((column) => {
          if (!column.validated) {
              errors.push(`Invalid Column: ${column.name} in Table: ${table.name}`);
          }
      });
  });
  return errors;
};
export default CreateModel;
