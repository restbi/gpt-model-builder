import { Model, Table } from "restbi-sdk";
export type PossibleModel = {
    name: string,
    tables: string[],
    reason: string
}
const Chat = (prompt: string): Promise<any> => {
    return fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({prompt: prompt }),
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
}


export const ListPossibleModels = async (tables: Table[], userSuggestions: string | null = null) => {
    let possibleModels: string[] = [];
    let prompt = `
    The following is a list of all tables in the database, and the columns within those tables in JSON format:
    ${
        tables.map((table) => {
            return JSON.stringify({
                table: table.name,
                columns: table.columns.map((column) => column.name)
            })
        }).join(', ')
    }
    A Model is a collection of tables and columns that can be used to create queries. Please analyze the tables 
    and columns above and suggest what models could be created from them. This could be one or several models, based on the dataset.
    A model typically represents a set of business questions, and tables that can be properly joined together to answer those questions.
    ${ userSuggestions ? `Here are an additional set of instructions to consider: ${userSuggestions}` : ''}
    type PossibleModel = {
        name: string,
        tables: string[],
        reason: string
    }
    Please provide your suggestions in JSON format as a list of PossibleModel. Do not provide any other words or text in the response.
    `;
    let response = await Chat(prompt);
    let cleanedText = response.response.replace("```json", "").replace("```", "");
    return JSON.parse(cleanedText);

}

export const CreateTableFromSuggested = async (tables: Table[], possibleTable: string, userSuggestions: string) => {
    const relevantTable = tables.find((table) => table.name === possibleTable || table.dbName === possibleTable);
    if (!relevantTable) {
        throw new Error(`Table ${possibleTable} not found in the database`);
    }
    let prompt = ` 
    The following is the definition of the table ${relevantTable.name}. 
    ${JSON.stringify(relevantTable)}
    Please create a valid Table based on the tables and columns above. The table should be named ${possibleTable}.
    ${ userSuggestions ? `Here are an additional set of instructions to consider: ${userSuggestions}` : ''}
    Here are the appropriate type definitions for creating the table:
    export enum ColumnDataType{STRING='STRING',NUMBER='NUMBER',DATE='DATE',BOOLEAN='BOOLEAN',JSON='JSON'}export enum ColumnType{MEASURE='MEASURE',DIMENSION='DIMENSION'}export type Column={id:string,dbName:string,name:string,alias?:string,type?:ColumnType,validated?:boolean,dataType?:ColumnDataType,aggregationType?:string}export type Table={id:string,dbName:string,name:string,schema?:string,alias?:string,validated?:boolean,columns:Column[]}
    Include that most people would find useful, ensure their display name is human readable. Include schema if available.
    Please provide your suggestions in JSON format as a Table. Do not provide any other words or text in the response.
    `;
    let response = await Chat(prompt);
    let cleanedText = response.response.replace("```json", "").replace("```", "");
    return JSON.parse(cleanedText);
}
export const CreateJoinsFromSuggested = async (tables: Table[], possibleModel: PossibleModel, userSuggestions: string) => {
    const relevantTables = tables.filter((table) => possibleModel.tables.includes(table.name) || possibleModel.tables.includes(table.dbName));
    let prompt = ` 
    The following is a list of all tables in the database, and the columns within those tables in JSON format:
    ${
        relevantTables.map((table) => {
            return JSON.stringify({
                table: table.name,
                schema: table.schema,
                columns: table.columns.map((column) => column.name)
            })
        }).join(', ')
    }
    Please create a valid list of Join objects based on the tables and columns above.
    ${ userSuggestions ? `Here are an additional set of instructions to consider: ${userSuggestions}` : ''}
    Here are the appropriate type definitions for creating the joins:
    export type JoinClause={column1:string,column2:string,operator:string}export type Join={id:string,validated?:boolean,table1:string,table2:string,clauses:JoinClause[],joinType?:string}
    Please provide your suggestions in JSON format as a Join. Do not provide any other words or text in the response.
    `;
    let response = await Chat(prompt);
    let cleanedText = response.response.replace("```json", "").replace("```", "");
    return JSON.parse(cleanedText);
}
export const CreateModelFromSuggested = async (tables: Table[], possibleModel: PossibleModel, userSuggestions: string) => {
    const relevantTables = tables.filter((table) => possibleModel.tables.includes(table.name) || possibleModel.tables.includes(table.dbName));
    let prompt = `
    The following is a list of all tables in the database, and the columns within those tables in JSON format:
    ${
        relevantTables.map((table) => {
            return JSON.stringify({
                table: table.name,
                schema: table.schema,
                columns: table.columns.map((column) => column.name)
            })
        }).join(', ')
    }
    Please create a valid Model based on the tables and columns above. The model should be named ${possibleModel.name}.
    ${ userSuggestions ? `Here are an additional set of instructions to consider: ${userSuggestions}` : ''}
    Here are the appropriate type definitions for creating the model:
    export enum DatabaseType{POSTGRES='POSTGRES',MYSQL='MYSQL',ORACLE='ORACLE',SQL_SERVER='SQL_SERVER',SQLITE='SQLITE',SNOWFLAKE='SNOWFLAKE'}export enum ColumnDataType{STRING='STRING',NUMBER='NUMBER',DATE='DATE',BOOLEAN='BOOLEAN',JSON='JSON'}export enum ColumnType{MEASURE='MEASURE',DIMENSION='DIMENSION'}export type Connection={id:string,name:string,host:string,port:number,user:string,password:string,database:string,type:DatabaseType,schema?:string,warehouse?:string,role?:string}export type Table={id:string,dbName:string,name:string,schema?:string,alias?:string,validated?:boolean,columns:Column[]}export type Column={id:string,dbName:string,name:string,alias?:string,type?:ColumnType,validated?:boolean,dataType?:ColumnDataType,aggregationType?:string}export type JoinClause={column1:string,column2:string,operator:string}export type Join={id:string,validated?:boolean,table1:string,table2:string,clauses:JoinClause[],joinType?:string}export type Model={id:string,name:string,displayName?:string,connection:Connection,tables:Table[],joins:Join[],formulas:Formula[],filters:Filter[]}export type Formula={id:string,name:string,expression:string}export type Filter={id:string,name:string,expression:string}export type ValidationResult={model:Model,dbTables:Table[]}
    Do not include a connection object in the model. Include tables, joins, formulas, and filters as needed. Include schema in tables if available. Be sure to limit columns to those that are necessary for the model.
    Please provide your suggestions in JSON format as a Model. Do not provide any other words or text in the response.
    `;
    let response = await Chat(prompt);
    let cleanedText = response.response.replace("```json", "").replace("```", "");
    return JSON.parse(cleanedText);
}   

export const FixModel = async (tables: Table[], model: Model, userSuggestions: string) => {
    let modelTables = model.tables.map((table) => table.name);
    const relevantTables = tables.filter((table) => modelTables.includes(table.name) || modelTables.includes(table.dbName));
    let prompt = `
    The following is a list of all tables in the database, and the columns within those tables in JSON format:
    ${
        relevantTables.map((table) => {
            return JSON.stringify({
                table: table.name,
                schema: table.schema,
                columns: table.columns.map((column) => column.name)
            })
        }).join(', ')
    }
    Please fix the following model. The model should be named ${model.name}.
    ${ JSON.stringify(model) }
    ${ userSuggestions ? `Here are an additional set of instructions to consider: ${userSuggestions}` : ''}
    Here are the appropriate type definitions for fixing the model:
    export enum DatabaseType{POSTGRES='POSTGRES',MYSQL='MYSQL',ORACLE='ORACLE',SQL_SERVER='SQL_SERVER',SQLITE='SQLITE',SNOWFLAKE='SNOWFLAKE'}export enum ColumnDataType{STRING='STRING',NUMBER='NUMBER',DATE='DATE',BOOLEAN='BOOLEAN',JSON='JSON'}export enum ColumnType{MEASURE='MEASURE',DIMENSION='DIMENSION'}export type Connection={id:string,name:string,host:string,port:number,user:string,password:string,database:string,type:DatabaseType,schema?:string,warehouse?:string,role?:string}export type Table={id:string,dbName:string,name:string,schema?:string,alias?:string,validated?:boolean,columns:Column[]}export type Column={id:string,dbName:string,name:string,alias?:string,type?:ColumnType,validated?:boolean,dataType?:ColumnDataType,aggregationType?:string}export type JoinClause={column1:string,column2:string,operator:string}export type Join={id:string,validated?:boolean,table1:string,table2:string,clauses:JoinClause[],joinType?:string}export type Model={id:string,name:string,displayName?:string,connection:Connection,tables:Table[],joins:Join[],formulas:Formula[],filters:Filter[]}export type Formula={id:string,name:string,expression:string}export type Filter={id:string,name:string,expression:string}export type ValidationResult={model:Model,dbTables:Table[]}
    Do not include a connection object in the model. Include tables, joins, formulas, and filters as needed. Include schema in tables if available. Be sure to limit columns to those that are necessary for the model.
    Please provide your suggestions in JSON format as a Model. Do not provide any other words or text in the response.
    `;
    let response = await Chat(prompt);
    let cleanedText = response.response.replace("```json", "").replace("```", "");
    return JSON.parse(cleanedText);
}

export const ConvertQuestionToQuery = async (tables: Table[], question: string) => {
    let prompt = `
    The following is a list of all columns available to us.
    ${
        tables.map((table) => {
            return table.columns.map((column) => column.name).join(', ')
        }).join(', ')
    }
    I want to answer the following question: ${question}
    Please convert this into a Query. The query typein this case is a custom JSON syntax:
    export type Query={columns:string[];filters?:QueryFilter[];sortBy?:SortClause|SortClause[];limit?:number;offset?:number;} export enum SortDirection{ASC='ASC',DESC='DESC'} export type SortClause={name:string;direction:SortDirection;} export type QueryFilter={column:string;operator:string;value:string|number|boolean|Date|string[]|undefined;}
    Columns can only contain column names with exact spelling, do not include aggreagtion or aliasing. 
    Please provide your query in JSON format. Do not provide any other words or text in the response.
    `;
    let response = await Chat(prompt);
    let cleanedText = response.response.replace("```json", "").replace("```", "");
    return JSON.parse(cleanedText);
}