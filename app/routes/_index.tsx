import type { ActionFunction, V2_MetaFunction } from '@remix-run/node'
import { useActionData } from '@remix-run/react';
import { nanoid } from 'nanoid'
import axios from 'axios'

import { withZod } from "@remix-validated-form/with-zod";
import {
  ValidatedForm,
  useField,
  validationError,
} from "remix-validated-form";
import { z } from "zod";
import { deleteSearches, getHistory, saveSearch } from '~/database';
import { useRef } from 'react';

const USER_ID = nanoid()

export const meta: V2_MetaFunction = () => {
  return [
    { title: 'Giphy Search' },
    { name: 'description', content: 'Search you gif!' },
  ]
}

const searchValidator = withZod(
  z.object({
    search: z.string().min(1),
    userId: z.string()
  })
);

const deleteHistoryValidator = withZod(
  z.object({
    searchTerm: z.string().min(1)
  })
)

type Image = {
  [key: string]: unknown
  original: {
    [key: string]: string
    webp: string
    hash: string
  }
}

type SearchGifResult = {
  data: {
    [key: string]: unknown
    images: Image
  }[]
  pagination: {
    total_count: number
    count: number
    offset: number
  }
}

type Gif = {
  id: string
  url: string
}

const FORM_SEARCH_ID = 'search'
const FORM_DELETE_HISTORY_ID = 'delete-history'

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  formData.forEach((value, key) => {
    console.log(key, value)
  })
  console.log('####################')

  if (formData.get('__rvfInternalFormId') === FORM_DELETE_HISTORY_ID) {
    await deleteSearches(USER_ID)

    return {
      searchTerm: formData.get('searchTerm') ?? '',
      gifs: [],
      history: []
    }
  }

  const validationResult = await searchValidator.validate(formData)

  if (validationResult.error) return validationError(validationResult.error)

  // TODO: mover lógica del fetch a una función en otro archivo
  const { data: { search, userId } } = validationResult
  const url = new URL('http://api.giphy.com/v1/gifs/search')
  url.searchParams.set('q', search)
  url.searchParams.set('api_key', 'pLURtkhVrUXr3KG25Gy5IvzziV5OrZGa')
  url.searchParams.set('limit', '10')

  // TODO: manejar paginación
  const { data: { data: gifs } } = await axios.get<SearchGifResult>(url.toString())
  const finalGifs = gifs.map(gif => ({
    id: gif.images.original.hash,
    url: gif.images.original.webp,
  })) as Gif[]

  await saveSearch(userId, search)
  const history = await getHistory(userId)

  return {
    searchTerm: search,
    gifs: finalGifs,
    history: history.map(({ searchTerm }) => searchTerm)
  }
}

type ActionResult = { searchTerm: string; gifs: Gif[]; history: string[] }

export default function Index() {
  const searchTerm = useRef('')
  const searchResult = useActionData<ActionResult>()
  const { error } = useField('search', { formId: FORM_SEARCH_ID })

  // TODO: hacer submit con un enter en el form
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <h1>Giphy Search</h1>
      <section className='form-container'>
        <ValidatedForm
          className='form'
          validator={searchValidator}
          method='post'
          resetAfterSubmit={false}
          id={FORM_SEARCH_ID}
        >
          <label htmlFor="search">Search</label>
          <input
            type="text"
            name="search"
            id="search"
            onChange={value => {
              if (value) searchTerm.current = value.target.value
            }}
          />
          <input type="hidden" name="userId" value={USER_ID} />
          {error ? (<p>{error}</p>) : null}
          <button type="submit">Search</button>
        </ValidatedForm>
        {searchResult ? (
          Array.isArray(searchResult.history) && searchResult.history.length > 0 ? (
            <div className='history'>
              <ul>
                {searchResult.history.map((record) => {
                  return (
                    <li key={record}>{record}</li>
                  )
                })}
              </ul>
              <ValidatedForm method='post' id={FORM_DELETE_HISTORY_ID} validator={deleteHistoryValidator}>
                <input type="hidden" name="searchTerm" value={searchTerm.current} />
                <button>Delete history</button>
              </ValidatedForm>
            </div>
          ) : (
            <p>No history</p>
          )
        ) : null}
        </section>
      {searchResult ? (
        Array.isArray(searchResult.gifs) && searchResult.gifs.length > 0 ? (
          <ul>
            {searchResult.gifs.map(({ id, url }, index) => {
              // TODO: usar un componente para mostrar el gif que tenga un figure con un figcaption, alt text y un link al gif en giphy
              return (
                <img key={id} src={url} alt={`${searchResult.searchTerm}-${index + 1}`} />
              )
            })}
          </ul>
        ) : (
          <p>No results</p>
        )
      ) : null}
    </main>
  )
}
