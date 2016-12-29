module.exports = {
  plugin: {
    homepage: { $content: false },
    sourceUrl: { $content: false },
    unicodeVersion: { $content: false },
    x64Version: { $content: false },
    ansiVersion: { $content: false },
    description: { $content: false },
    author: { $content: false },
    latestUpdate: { $content: false },
    stability: { $content: false },
    isLibrary: { $content: false },
    dependencies: {
      $arrayElement: true
    },
    aliases: {
      $arrayElement: true,
      $content: false
    },
    versions: {
      $arrayElement: true,
      $content: false
    },
    install: {
      $arrayElement: true,
      $content: false,
      unicode: {
        $arrayElement: true,
        $content: false,
        download: { $content: 'url' }
      },
      x64: {
        $arrayElement: true,
        $content: false,
        download: { $content: 'url' }
      },
      ansi: {
        $arrayElement: true,
        $content: false,
        download: { $content: 'url' }
      }
    }
  }
};

