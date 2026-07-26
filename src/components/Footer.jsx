function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__disclaimer">
          This website is an independent hobby project and is not affiliated with the
          International Federation of Red Cross and Red Crescent Societies.
        </p>
        <ul className="footer__links">
          <li>
            Appeal data:{' '}
            <a href="https://goadmin.ifrc.org/docs/#api-v2-appeal-list">IFRC GO</a>
          </li>
          <li>
            Swiss CPI:{' '}
            <a href="https://www.bfs.admin.ch/asset/de/cc-d-05.02.08">
              Federal Statistical Office
            </a>
          </li>
          <li>
            The story behind this chart:{' '}
            <a href="https://medium.com/@tmarki/how-much-are-we-really-spending-on-disaster-response-8f6eb9d5da33">
              read the article
            </a>
          </li>
          <li>
            Code: <a href="https://github.com/tmrk/humfin-history">GitHub</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}

export default Footer;
