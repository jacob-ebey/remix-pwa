import { useLoaderData } from "remix";
import type { LoaderFunction } from "remix";

export let loader: LoaderFunction = () => {
  return { message: "About" };
};

export default function AboutRoute() {
  let { message } = useLoaderData();

  return (
    <article>
      <h1>{message}</h1>
      <p>
        This example utilizes a hand crafted web worker that employs multiple
        caching strategies depending on the requests.
      </p>
      <ul>
        <li>
          <strong>Network First</strong> is used for document and data requests.
        </li>
        <li>
          <strong>Cache First</strong> is used for assets.
        </li>
      </ul>

      <h2>Viewing the behavior</h2>
      <p>
        I'm assuming you're using chrome and have used dev-tools before or are
        capable of googling:
      </p>
      <ol>
        <li>Open dev-tools</li>
        <li>
          Open the <b>Application</b> tab, select <b>Storage</b> and click{" "}
          <b>Clear site data</b>
        </li>
        <li>Reload the page</li>
        <li>
          Click on the <b>Home</b> link above. This will do a client side
          navigation to the home page
        </li>
        <li>
          Open the <b>Network</b> tab and set throttling to <b>Offline</b>
        </li>
      </ol>

      <p>
        If you've followed the steps above, even though you did not visit the
        home page via a document request, you can still reload the page and
        access it.
      </p>
      <p>
        Similarly, even though you didn't client side navigate to the about
        page, if you click on the <b>About</b> link from the home page you can
        still access the about page.
      </p>
    </article>
  );
}
