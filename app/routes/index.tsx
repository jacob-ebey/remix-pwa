import { Link, useLoaderData } from "remix";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = () => {
  return { message: "Welcome!" };
};

export default function IndexRoute() {
  let { message } = useLoaderData();

  return (
    <article>
      <h1>{message}</h1>
      <p>
        This is an example PWA built with{" "}
        <a href="https://remix.run" target="_blank" rel="noreferrer noopener">
          Remix
        </a>
        .
      </p>
      <p>
        Since Remix utlizes SSR + client side navigations you actually have two
        ways the data ends up in your components:
      </p>
      <ol>
        <li>embeded in the initial HTML for document requests</li>
        <li>
          <b>or fetch()</b> from the network for client side navigations
        </li>
      </ol>
      <p>
        To account for this when you landed on a page through a document request
        the service worker will <b>fetch()</b> the equivilant data in the
        background to simulate that you landed on the page through a cient side
        navigation.
      </p>
      <p>
        Similarly, if you land on a page through a client side navigation the
        service worker will simulate a full page document navigation and cache
        that in the background so when you reload the page you can still access
        it.
      </p>
      <p>
        Head on over to the <Link to="/about">about page</Link> for instructions
        on how to view this behavior.
      </p>
    </article>
  );
}
